package com.beddatech.accessibilitycontroller

import android.os.Build
import android.os.Bundle
import android.view.accessibility.AccessibilityNodeInfo

/**
 * Dispatches accessibility actions to specific nodes identified by the nodeId
 * format used by [ScreenReader]:  "<windowId>:<identifier>"  where identifier
 * is either the viewIdResourceName or the identityHashCode string.
 *
 * All public functions return `true` on success, `false` when the node cannot
 * be found or the action is not supported / rejected by the target view.
 */
object ActionDispatcher {

    // -----------------------------------------------------------------------
    // Public API
    // -----------------------------------------------------------------------

    /**
     * Perform a named action (one of the NodeAction string literals from the
     * JS types) on the node with the given ID.
     *
     * For "setText" prefer [setNodeText] which accepts the text argument.
     */
    fun performAction(nodeId: String, action: String): Boolean {
        if (action == "imeEnter") {
            return executeOnNode(nodeId) { node ->
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                    @Suppress("NewApi")
                    node.performAction(AccessibilityNodeInfo.ACTION_IME_ENTER)
                } else {
                    // Pre-API-30 fallback: click the node (submits most form fields).
                    node.performAction(AccessibilityNodeInfo.ACTION_CLICK)
                }
            }
        }
        val androidActionId = jsActionToAndroid(action) ?: return false
        return executeOnNode(nodeId) { node ->
            node.performAction(androidActionId)
        }
    }

    /** Convenience wrapper: ACTION_CLICK. */
    fun tapNode(nodeId: String): Boolean = executeOnNode(nodeId) { node ->
        node.performAction(AccessibilityNodeInfo.ACTION_CLICK)
    }

    /** Convenience wrapper: ACTION_LONG_CLICK. */
    fun longPressNode(nodeId: String): Boolean = executeOnNode(nodeId) { node ->
        node.performAction(AccessibilityNodeInfo.ACTION_LONG_CLICK)
    }

    /**
     * Set the text of an editable node.
     * Sends ACTION_SET_TEXT with the text in the required Bundle argument.
     */
    fun setNodeText(nodeId: String, text: String): Boolean =
        executeOnNode(nodeId) { node ->
            val args = Bundle().apply {
                putCharSequence(
                    AccessibilityNodeInfo.ACTION_ARGUMENT_SET_TEXT_CHARSEQUENCE,
                    text,
                )
            }
            node.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, args)
        }

    /**
     * Scroll a scrollable node.
     *
     * "up" / "left"  → ACTION_SCROLL_BACKWARD
     * "down" / "right" → ACTION_SCROLL_FORWARD
     */
    fun scrollNode(nodeId: String, direction: String): Boolean {
        val action = when (direction) {
            "up", "left"    -> AccessibilityNodeInfo.ACTION_SCROLL_BACKWARD
            "down", "right" -> AccessibilityNodeInfo.ACTION_SCROLL_FORWARD
            else            -> return false
        }
        return executeOnNode(nodeId) { node -> node.performAction(action) }
    }

    // -----------------------------------------------------------------------
    // Node lookup + action execution
    // -----------------------------------------------------------------------

    /**
     * Parse [nodeId], locate the matching [AccessibilityNodeInfo] in the live
     * tree, execute [block] on it, then recycle all traversed nodes.
     *
     * The action inside [block] is executed while the node is still alive;
     * after [block] returns the node is safely recycled by its parent frame.
     */
    private fun executeOnNode(
        nodeId: String,
        block: (AccessibilityNodeInfo) -> Boolean,
    ): Boolean {
        val colonIdx = nodeId.indexOf(':')
        if (colonIdx < 0) return false

        val windowId   = nodeId.substring(0, colonIdx).toIntOrNull() ?: return false
        val identifier = nodeId.substring(colonIdx + 1)

        val service = AccessibilityControllerService.instance ?: return false
        val root    = service.rootInActiveWindow       ?: return false

        return try {
            findAndExecute(root, windowId, identifier, block)
        } finally {
            @Suppress("DEPRECATION")
            root.recycle()
        }
    }

    /**
     * Depth-first search for the target node; executes [block] as soon as it
     * is found.  All child nodes are recycled in their own finally blocks so
     * the traversal is leak-free on API < 33.
     */
    private fun findAndExecute(
        node: AccessibilityNodeInfo,
        targetWindowId: Int,
        identifier: String,
        block: (AccessibilityNodeInfo) -> Boolean,
    ): Boolean {
        // Match check for the current node.
        if (node.windowId == targetWindowId && matchesIdentifier(node, identifier)) {
            // Perform the action synchronously; node is recycled by the caller.
            return block(node)
        }

        // Recurse into children.
        for (i in 0 until node.childCount) {
            val child = node.getChild(i) ?: continue
            try {
                if (findAndExecute(child, targetWindowId, identifier, block)) {
                    return true
                }
            } finally {
                // Safe: if we found the target inside this subtree, the action
                // was already performed before this finally block runs.
                @Suppress("DEPRECATION")
                child.recycle()
            }
        }
        return false
    }

    // -----------------------------------------------------------------------
    // Helpers
    // -----------------------------------------------------------------------

    /**
     * Returns true if [node] corresponds to [identifier].
     *
     * Matching strategy (in order):
     * 1. Full viewIdResourceName match ("com.pkg:id/name" or just "name").
     * 2. Identity hash code match (fallback for nodes without a resource ID).
     */
    private fun matchesIdentifier(
        node: AccessibilityNodeInfo,
        identifier: String,
    ): Boolean {
        val viewId = node.viewIdResourceName
        return if (viewId != null) {
            viewId == identifier
        } else {
            System.identityHashCode(node).toString() == identifier
        }
    }

    /** Map JS NodeAction string literals to Android AccessibilityNodeInfo action IDs. */
    private fun jsActionToAndroid(action: String): Int? = when (action) {
        "click"          -> AccessibilityNodeInfo.ACTION_CLICK
        "longClick"      -> AccessibilityNodeInfo.ACTION_LONG_CLICK
        "scrollForward"  -> AccessibilityNodeInfo.ACTION_SCROLL_FORWARD
        "scrollBackward" -> AccessibilityNodeInfo.ACTION_SCROLL_BACKWARD
        "clearFocus"     -> AccessibilityNodeInfo.ACTION_CLEAR_FOCUS
        "select"         -> AccessibilityNodeInfo.ACTION_SELECT
        "clearText"      -> AccessibilityNodeInfo.ACTION_CLEAR_TEXT
        else             -> null
    }
}
