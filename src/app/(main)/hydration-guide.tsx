// ─────────────────────────────────────────────────────────────
// app/(main)/hydration-guide.tsx
//
// Reference screen for the "Learn more" link on Daily Goal.
//
// Content is deliberately general and non-prescriptive — the app
// is not a medical device, and the copy should never read as a
// recommendation for a specific individual.
// ─────────────────────────────────────────────────────────────
import { IconButton } from "@/components/icon-button";
import { ScrollScreen } from "@/components/screen";
import Text from "@/components/text";
import { router } from "expo-router";
import React, { useCallback } from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

// ─────────────────────────────────────────────────────────────
// Content
// ─────────────────────────────────────────────────────────────

interface GuideSection {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
}

const SECTIONS: readonly GuideSection[] = [
  {
    heading: "How much water do you need?",
    paragraphs: [
      "There's no single number that fits everyone. Fluid needs depend on your body size, activity level, climate, and what you eat and drink throughout the day. The widely cited figure of about two litres per day is a general starting point, not a target that's right for every person.",
      "Food contributes a meaningful share of daily fluid — fruits, vegetables, soups, and other water-rich foods all count. Plain water is one part of the picture, not the whole of it.",
    ],
  },
  {
    heading: "Choosing your daily goal",
    paragraphs: [
      "Siply's default goal is 2,000 ml, which sits comfortably within most general recommendations for healthy adults. If you're consistently hitting your goal but feel thirsty, or if you're consistently missing it and feeling fine, adjust it.",
    ],
    bullets: [
      "Light — around 1,500 ml, a gentle target for cooler climates and low activity.",
      "Recommended — around 2,000 ml, the app's default starting point.",
      "Active — around 2,500 ml, suited to regular exercise or warm weather.",
    ],
  },
  {
    heading: "Everyday signs to watch for",
    paragraphs: [
      "Thirst is a useful signal, but it lags behind your body's actual needs. A more reliable early indicator is the colour of your urine: pale straw-yellow is generally a good sign, while dark amber suggests you could drink more.",
    ],
    bullets: [
      "Dry mouth, fatigue, or a mild headache in the afternoon.",
      "Difficulty concentrating after a long stretch without fluids.",
      "Dark-coloured urine or infrequent bathroom trips.",
    ],
  },
  {
    heading: "Making it a habit",
    paragraphs: [
      "Hydration is easier to maintain when it's attached to something that already happens — a glass with every meal, a bottle on your desk, a reminder before each meeting. Siply's reminders exist to help you build that rhythm, not to prescribe a fixed schedule.",
      "If you're consistently hitting your goal without thinking about it, that's a sign it's become a habit. If you're not, try anchoring one glass to an existing routine rather than trying to remember to drink more generally.",
    ],
  },
  {
    heading: "When to talk to a professional",
    paragraphs: [
      "This guide is general information, not medical advice. If you have a medical condition that affects fluid balance — heart, kidney, or liver conditions, for example — or if you take medication that changes how your body handles fluids, ask a healthcare professional what's right for you.",
      "If you notice sudden changes in thirst, urination, or how you feel after drinking, don't use this app to make decisions about your health. Seek proper medical guidance.",
    ],
  },
];

// ─────────────────────────────────────────────────────────────
// Screen
// ─────────────────────────────────────────────────────────────

export default function HydrationGuideScreen() {
  const handleBack = useCallback(() => {
    if (router.canGoBack()) router.back();
  }, []);

  const header = (
    <View style={styles.headerRow}>
      <IconButton
        name="chevron-back"
        onPress={handleBack}
        accessibilityLabel="Go back"
        testID="hydration-guide-back"
      />
      <Text
        variant="title"
        color="onBackground"
        textAlign="center"
        style={styles.headerTitle}
      >
        Hydration Guide
      </Text>
      <View style={styles.headerSpacer} />
    </View>
  );

  return (
    <ScrollScreen header={header} testID="hydration-guide-screen">
      <View style={styles.intro}>
        <Text variant="caption" color="mutedText">
          General information, not medical advice
        </Text>
        <Text variant="body" color="onBackground">
          A short guide to daily hydration — how the numbers are chosen, what to
          look for, and how to build a habit that sticks.
        </Text>
      </View>

      {SECTIONS.map((section) => (
        <View key={section.heading} style={styles.section}>
          <Text variant="h3" color="onBackground">
            {section.heading}
          </Text>

          {section.paragraphs.map((paragraph, index) => (
            <Text
              key={`${section.heading}-${index}`}
              variant="body"
              color="onBackground"
            >
              {paragraph}
            </Text>
          ))}

          {section.bullets && (
            <View style={styles.bullets}>
              {section.bullets.map((bullet) => (
                <View key={bullet} style={styles.bulletRow}>
                  <View style={styles.bullet} />
                  <Text
                    variant="body"
                    color="onBackground"
                    style={styles.bulletText}
                  >
                    {bullet}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      ))}
    </ScrollScreen>
  );
}

const styles = StyleSheet.create((theme) => ({
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: theme.layout.minTouchTarget,
  },
  headerTitle: {
    flex: 1,
  },
  headerSpacer: {
    width: theme.layout.minTouchTarget,
    height: theme.layout.minTouchTarget,
  },
  intro: {
    gap: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: theme.borderWidth.thin,
    borderBottomColor: theme.colors.panelBorder,
  },
  section: {
    gap: theme.spacing.sm,
  },
  bullets: {
    gap: theme.spacing.sm,
    paddingTop: theme.spacing.xxs,
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: theme.spacing.sm,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 9,
    backgroundColor: theme.colors.primary,
  },
  bulletText: {
    flex: 1,
  },
}));
