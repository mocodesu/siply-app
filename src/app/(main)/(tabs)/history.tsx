import { ScrollScreen } from "@/components/screen";
import Text from "@/components/text";
import React from "react";

export default function HistoryScreen() {
  return (
    <ScrollScreen testID="history-screen">
      <Text variant="h1" color="onBackground">
        History
      </Text>
      <Text variant="subhead" color="mutedText">
        Your logged water entries will appear here.
      </Text>
    </ScrollScreen>
  );
}
