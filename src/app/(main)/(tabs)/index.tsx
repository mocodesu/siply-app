import { ScrollScreen } from "@/components/screen";
import Text from "@/components/text";
import { APP_NAME } from "@/constants";
import React from "react";
import { StyleSheet } from "react-native-unistyles";

const index = () => {
  return (
    <ScrollScreen>
      <Text color="primary" semibold variant="display" textAlign="center">
        Hello {APP_NAME} project
      </Text>
    </ScrollScreen>
  );
};

export default index;

const styles = StyleSheet.create((theme, rt) => ({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.background,
  },
}));
