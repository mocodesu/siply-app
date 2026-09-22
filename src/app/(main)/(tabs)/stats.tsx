import { ScrollScreen } from "@/components/screen";
import Text from "@/components/text";
import React from "react";

export default function StatsScreen() {
  return (
    <ScrollScreen testID="stats-screen">
      <Text variant="h1" color="onBackground">
        Statistics
      </Text>
      <Text variant="subhead" color="mutedText">
        Weekly and monthly charts will appear here.
      </Text>
    </ScrollScreen>
  );
}
