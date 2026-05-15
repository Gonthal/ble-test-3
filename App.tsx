import React, { useState, useEffect } from "react";
import {
  Dimensions,
  Image,
  ImageBackground,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Device } from 'react-native-ble-plx';

import * as SecureStore from 'expo-secure-store';

import DeviceModal from "./components/DeviceConnectionModal";
import useBLE from "./hooks/useBLE";
import userSecureStore from "./hooks/userSecureStore";
import KeyboardAvoidingContainer from "./components/KeyboardAvoidingView";
import LockControl from "./components/LockControl";
import PasswordWidget from "./components/PasswordWidget";

const BackgroundImage = Platform.select({
  ios: require('./assets/background-image-ios.jpg'),
  android: require('./assets/background-image-android.jpg'),
});
const dimensions = Dimensions.get("window");
const ActivateButton = require('./assets/blue-button.png');

const App = () => {
  const {
    allDevices,
    connectedDevice,
    connectedDeviceRef,
    connectToDevice,
    requestPermissions,
    scanForPeripherals,
    disconnectFromDevice,
    activateButton,
    authenticateDevice,
    changeDevicePassword,
    autoConnectToDevice,
    clearance,
    isBLEAvailable,
    lockState
  } = useBLE();

  const { save, getValueFor } = userSecureStore();
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);

  type AppState = 'DISCONNECTED' | 'SCANNING' | 'CONNECTING' | 'AUTHENTICATING' | 'CLEARED';
  const [appState, setAppState] = useState<AppState>('DISCONNECTED');
  const [hasAttemptedAutoAuth, setHasAttemptedAutoAuth] = useState<boolean>(false);

  const scanForDevices = async () => {
    const isPermissionsEnabled = await requestPermissions();
    if (isPermissionsEnabled) {
      scanForPeripherals();
    }
  };

  const hideModal = () => {
    setIsModalVisible(false);
    if (connectedDevice) {
      save("deviceID", connectedDevice.id);
    }
  };

  const openModal = () => {
    scanForDevices();
    setIsModalVisible(true);
  };

  const autoConnect = async () => {
    console.log("[main] I am in or som");

    try {
      const savedId = await getValueFor("deviceID");
      const isPaired = await getValueFor("pairingStatus");

      if (savedId && isPaired === 'true') {
        console.log("[main] Found saved device, attempting auto-connection...");
        const savedPassword = await getValueFor("password");
        autoConnectToDevice(savedId, savedPassword ?? '');
      }
    } catch (error) {
      console.error("[main] Failed to auto-connect on startup", error);
    }
  }

  useEffect(() => {
    if (isBLEAvailable && !connectedDevice) {
      autoConnect();
    }
  }, [isBLEAvailable, connectedDevice]);

  useEffect(() => {
    if (connectedDevice && clearance === 1) {
      console.log("[main] Saving device...");
      save("deviceID", connectedDevice.id);
      save("pairingStatus", "true");
    } else {
      console.log("[main] I ran");
    }
  }, [clearance, connectedDevice]);

  // Intercept the manual authentication to save the password
  const handleManualAuth = (device: Device, pass: string) => {
    save("password", pass);

    authenticateDevice(device, pass);
  }

  useEffect(() => {
    const attemptAutoAuth = async () => {
      if (connectedDevice && clearance === 0 && !hasAttemptedAutoAuth) {
        setHasAttemptedAutoAuth(true);

        const savedPass = await getValueFor("password");

        if (savedPass) {
          console.log("[attemptAutoAuth] Auto-authenticating with saved password...");
          authenticateDevice(connectedDevice, savedPass);
        }
      }
    };

    attemptAutoAuth();
  }, [connectedDevice, clearance, hasAttemptedAutoAuth]);

  useEffect(() => {
    if (!connectedDevice) {
      setHasAttemptedAutoAuth(false);
    }
  }, [connectedDevice]);

  const handleForgetDevice = async () => {
    console.log("Forgetting device and wiping memory...");

    // Physically delete the keys so getValueFor returns null 
    await SecureStore.deleteItemAsync("deviceID");
    await SecureStore.deleteItemAsync("pairingStatus");
    await SecureStore.deleteItemAsync("password");

    if (connectedDevice) {
      disconnectFromDevice(connectedDevice.id);
    }
  }

  return (
    <KeyboardAvoidingContainer>
      <StatusBar backgroundColor={"#414141"} />
      <ImageBackground
        style={styles.backgroundContainer}
        resizeMode="cover"
        source={BackgroundImage}
      >
        <View style={styles.container}>
          {
            // STATE 1: NOT CONNECTED
            !connectedDevice ? (
              <TouchableOpacity onPress={openModal} style={styles.regularButton}>
                <Text style={styles.regularButtonText}>Connect</Text>
              </TouchableOpacity>
            )
            // STATE 2: CONNECTED BUT LOCKED
            : clearance === 0 ? (
              <PasswordWidget
                device={connectedDevice}
                clearance={clearance}
                authenticateDevice={handleManualAuth}
                changeDevicePassword={changeDevicePassword}
              />
            )
            // STATE 3: CONNECTED AND CLEARED
            : (
              <>
                <LockControl
                  deviceRef={connectedDeviceRef}
                  buttonImage={ActivateButton}
                  lockState={lockState}
                  activateButton={activateButton}
                />

                <View style={{ marginTop: 0 }}>
                    <PasswordWidget
                      device={connectedDevice}
                      clearance={clearance}
                      authenticateDevice={handleManualAuth}
                      changeDevicePassword={changeDevicePassword}
                    />
                    <TouchableOpacity style={styles.regularButton} onPress={handleForgetDevice}>
                        <Text style={styles.regularButtonText}>Forget device</Text>
                    </TouchableOpacity>
                </View>
              </>
            )
          }
        </View>
      <DeviceModal
        closeModal={hideModal}
        visible={isModalVisible}
        connectToPeripheral={connectToDevice}
        devices={allDevices}
      />
      </ImageBackground>
    </KeyboardAvoidingContainer>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: dimensions.height / 3.0,
    paddingBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundContainer: {
    flex: 1,
    width: dimensions.width,
    height: dimensions.height,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#414141',
  },
  regularButton: {
    backgroundColor: "#C0C0C0",
    justifyContent: "center",
    alignItems: "center",
    height: 60,
    width: dimensions.width - 40,
    marginHorizontal: 20,
    marginBottom: 5,
    borderRadius: 8,
  },
  regularButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#F9F9F9", // Seasalt
  }
});

export default App;