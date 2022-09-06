import React, { useEffect, useState, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  Button,
  Platform,
  ScrollView,
} from "react-native";
import ConfettiCannon from "react-native-confetti-cannon";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import dayjs from "dayjs";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

// "BANCO DE DADOS" -------------------------------------------------
const storeData = async (key, value) => {
  try {
    await AsyncStorage.setItem(key, value);
  } catch (e) {
    console.error(e);
  }
};

const getData = async (key) => {
  try {
    const value = await AsyncStorage.getItem(key);
    return value;
  } catch (e) {
    console.error(e);
    return null;
  }
};
// -------------------------------------------------

async function scheduleNotification() {
  if (Platform.OS != "web") {
    await Notifications.requestPermissionsAsync().then((permission) => {
      Notifications.scheduleNotificationAsync({
        content: {
          title: "Contraceptive reminder",
          subtitle: "We can't have babies!!!",
        },
        trigger: {
          hour: 23,         /// ALTERAR O HORARIO AQUI
          minute: 41,
          repeats: true,
        },
      });
    });
  }
  // console.log("=)");
}

// gera uma chave unica para o o dia
const getDayKey = (date = new Date()) => {
  const startDate = date;
  startDate.setHours(0);
  startDate.setMinutes(0);
  startDate.setSeconds(0);
  startDate.setMilliseconds(0);

  return String(startDate.getTime());
};

const checkSeTomeiHoje = () => {
  const todayKey = getDayKey();
  return getData(todayKey).then((result) => {
    return result == "true";
  });
};

export default function App() {
  const todayKey = getDayKey();

  const [confetti, setConfetti] = useState(false);

  const [tomei, setTomei] = useState(false);
  const [week, setWeek] = useState([]);

  useEffect(() => {
    checkSeTomeiHoje().then((jaTomei) => {
      if (jaTomei) {
        setTomei(true);
      } else {
        setTomei(false);
        scheduleNotification();
      }
    });
  }, []);

  // se o tomei alterar, entao reatualiza "semana"
  useEffect(() => {
    loadWeek();
  }, [tomei]);

  const loadWeek = async () => {
    let current = dayjs(new Date()).subtract(3, "day");

    const days = [];
    for (let i = 0; i < 7; i++) {
      const result = await getData(getDayKey(current.toDate()));
      days.push({
        tomei: result === "true",
        date: current.toDate(),
      });
      current = current.add(1, "day");
    }

    setWeek(days);
  };

  const btnAction = () => {
    const newValue = !tomei;
    if (newValue) {
      setConfetti(true);
    }
    setTomei(newValue);
    storeData(todayKey, String(newValue));
  };

  return (
    <SafeAreaView style={styles.container}>
      {confetti ? (
        <ConfettiCannon
          count={200}
          origin={{ x: 0, y: 0 }}
          fadeOut={true}
          onAnimationEnd={() => setConfetti(false)}
        />
      ) : null}

      <View style={styles.waterGoalContainer}>
        <Text
          style={[
            styles.blueText,
            { fontSize: 22, textShadow: "rgb(0 0 0 / 26%) 1px 1px 8px" },
          ]}
        >
          Have you taken your Contraceptive Pills Today?{" "}
          <Text style={{ fontWeight: "bold" }}>{tomei ? "YES" : "NO"}</Text>
        </Text>
      </View>

      {/* ProgressView */}
      <View
        style={{
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <View style={{ justifyContent: "center" }}>
          <Text
            style={[styles.grayText, { fontSize: 28, textAlign: "center" }]}
          >
            Last week
          </Text>
          <ScrollView horizontal style={{ maxHeight: 50 }}>
            <View style={{ flexDirection: "row" }}>
              {week.map((day, i) => (
                <View
                  key={`week-${i}`}
                  style={{
                    alignItems: "center",
                    paddingHorizontal: 5,
                    ...(i != week.length - 1
                      ? { borderRightWidth: 1, borderRightColor: "#000" }
                      : {}),
                    ...(dayjs(day.date).isSame(new Date(), "day")
                      ? { backgroundColor: "pink" }
                      : {}),
                  }}
                >
                  <Text>{dayjs(day.date).format("DD/MM/YYYY")}</Text>
                  <Text>{day.tomei ? "Yes" : "No"}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>

        <View style={{ justifyContent: "center" }}>
          <Text style={[styles.grayText, { fontSize: 28 }]}>
            Take your pill
          </Text>
        </View>
      </View>

      <Button
        title={tomei ? "Destomar" : "Tomar"}
        onPress={() => btnAction()}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
  },
  progressBarContainer: {
    borderRadius: 40,
    borderWidth: 1,
    width: 40,
    height: 300,
    justifyContent: "flex-end",
  },
  waterButtonsContainer: {
    flexDirection: "row",
    paddingVertical: 10,
    width: "90%",
    justifyContent: "space-between",
  },
  waterGoalContainer: {
    padding: 50,
    alignItems: "center",
  },
  blueText: {
    color: "#efb2bd",
    fontWeight: "600",
  },
  grayText: { color: "#323033", fontWeight: "600" },
  notificationButton: {
    height: 50,
    borderRadius: 20,
    justifyContent: "center",
    padding: 7,
  },
  notificationText: { color: "white", fontWeight: "500", fontSize: 16 },
});
