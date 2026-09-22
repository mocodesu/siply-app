// ─────────────────────────────────────────────────────────────
// components/reminder-row.tsx
//
// One reminder: bell icon, time, cadence, status indicator, and a
// Switch. Swipe left to reveal a destructive Delete action.
//
// Uses `ReanimatedSwipeable` — the Reanimated 4 implementation.
// The legacy `Swipeable` from the package root is deprecated and
// runs its gesture on the JS thread.
//   See: docs.swmansion.com/react-native-gesture-handler/docs/components/reanimated_swipeable
// ─────────────────────────────────────────────────────────────
import { HapticPressable } from "@/components/Haptic-pressable";
import Text from "@/components/text";
import { MutedIcon } from "@/components/themed";
import { ToggleRow } from "@/components/toggle-row";
import type { ReminderStatus } from "@/hooks/use-reminder-actions";
import type { Reminder } from "@/repositories/reminder-repo";
import React, { useCallback, useRef } from "react";
import { View } from "react-native";
import ReanimatedSwipeable, {
  type SwipeableMethods,
} from "react-native-gesture-handler/ReanimatedSwipeable";
import Animated, {
  useAnimatedStyle,
  type SharedValue,
} from "react-native-reanimated";
import { StyleSheet } from "react-native-unistyles";

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

/** Width of the revealed delete action. */
const DELETE_WIDTH = 84;

/** Human-readable label per status. */
const STATUS_LABEL: Record<ReminderStatus, string> = {
  scheduled: "Scheduled",
  blocked: "Notifications blocked",
  off: "Every Day",
  pending: "Saving…",
};

// ─────────────────────────────────────────────────────────────
// Delete action
// ─────────────────────────────────────────────────────────────

interface DeleteActionProps {
  drag: SharedValue<number>;
  onPress: () => void;
  testID?: string;
}

function DeleteAction({ drag, onPress, testID }: DeleteActionProps) {
  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: drag.value + DELETE_WIDTH }],
  }));

  return (
    <Animated.View style={[styles.deleteWrapper, style]}>
      <HapticPressable
        testID={testID}
        onPress={onPress}
        haptic="warning"
        accessibilityLabel="Delete reminder"
        style={styles.deleteButton}
      >
        <MutedIcon name="trash-outline" size={20} />
        <Text variant="caption" color="white" textAlign="center">
          Delete
        </Text>
      </HapticPressable>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export interface ReminderRowProps {
  reminder: Reminder;
  status: ReminderStatus;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  /** When true, the switch and swipe are inert. */
  disabled?: boolean;
  /** When true, swiping is disabled entirely (e.g. while saving). */
  swipeDisabled?: boolean;
  testID?: string;
}

export function ReminderRow({
  reminder,
  status,
  onToggle,
  onDelete,
  disabled = false,
  swipeDisabled = false,
  testID,
}: ReminderRowProps) {
  const swipeRef = useRef<SwipeableMethods>(null);

  const handleDelete = useCallback(() => {
    // Close the swipe before removing so the row doesn't animate
    // out while still translated.
    swipeRef.current?.close();
    onDelete(reminder.id);
  }, [onDelete, reminder.id]);

  const renderRightActions = useCallback(
    (_progress: SharedValue<number>, drag: SharedValue<number>) => (
      <DeleteAction
        drag={drag}
        onPress={handleDelete}
        testID={testID ? `${testID}-delete` : undefined}
      />
    ),
    [handleDelete, testID],
  );

  const subtitle = STATUS_LABEL[status];
  const isBlocked = status === "blocked";

  return (
    <ReanimatedSwipeable
      ref={swipeRef}
      friction={2}
      rightThreshold={DELETE_WIDTH * 0.5}
      overshootRight={false}
      enabled={!swipeDisabled && !disabled}
      renderRightActions={renderRightActions}
      containerStyle={styles.swipeContainer}
    >
      <View testID={testID} style={styles.wrapper}>
        <View
          style={styles.bell}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <MutedIcon
            name={
              isBlocked ? "notifications-off-outline" : "notifications-outline"
            }
            size={18}
          />
        </View>

        <ToggleRow
          label={reminder.label}
          subtitle={subtitle}
          value={reminder.enabled}
          onValueChange={() => onToggle(reminder.id)}
          disabled={disabled || status === "pending"}
          style={styles.toggle}
          testID={testID ? `${testID}-toggle` : undefined}
          switchTestID={testID ? `${testID}-switch` : undefined}
        />
      </View>
    </ReanimatedSwipeable>
  );
}

// ─────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────

const styles = StyleSheet.create((theme) => ({
  swipeContainer: {
    borderRadius: theme.radii.md,
    overflow: "hidden",
  },
  wrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.md,
  },
  bell: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.panel,
  },
  toggle: {
    flex: 1,
    paddingHorizontal: 0,
  },
  deleteWrapper: {
    width: DELETE_WIDTH,
    backgroundColor: theme.colors.danger,
  },
  deleteButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.xxs,
  },
}));
