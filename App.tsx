import React, { useState, useEffect, useRef } from "react";
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

import * as SecureStore from 'expo-secure-store';

import DeviceModal from "./components/DeviceConnectionModal";
import useBLE from "./hooks/useBLE";
//import UserInput from "./components/UserInput";
import userSecureStore from "./hooks/userSecureStore";
import KeyboardAvoidingContainer from "./components/KeyboardAvoidingView";
//import LottieView from "lottie-react-native";
//import soundPlayer from "./hooks/soundPlayer";
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
    scanForReconnection,
    writePassword,
    //retrieveDevice,
    disconnectFromDevice,
    handleDisconnection,
    activateButton,
    authenticateDevice,
    changeDevicePassword,
    isPairedRef,
    isPaired,
    pairedDeviceIDRef,
    passwordRef,
    clearance,
    pairedDeviceFound,
    isBLEAvailable,
    lockState,
  } = useBLE();

  const { save, getValueFor } = userSecureStore();
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);

  type AppState = 'DISCONNECTED' | 'SCANNING' | 'CONNECTING' | 'AUTHENTICATING' | 'CLEARED';
  const [appState, setAppState] = useState<AppState>('DISCONNECTED');

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

  useEffect(() => {
    const autoConnect = async () => {
      // Do nothing if BLE is turned off or not ready yet
      if (!isBLEAvailable) return;

      try {
        // Ask the Storage Manager for the saved data
        const savedId = await getValueFor("deviceID");
        const isPaired = await getValueFor("pairingStatus");

        // If we are paired and have an ID, tell the BLE Manager to connect
        if (savedId && isPaired === 'true') {
          console.log("Found saved device, attempting auto-connection...");
          await connectToDevice(null, savedId);
        }
      } catch (error) {
          console.error("Failed to auto-connect on startup", error);
      };

      autoConnect();

      return () => {
        if (connectedDevice) {
          disconnectFromDevice(connectedDevice.id);
        }
      }
    }
  }, [isBLEAvailable])

  useEffect(() => {
    if (connectedDevice && clearance === 1) {
      save("deviceID", connectedDevice.id);
      save("pairingStatus", "true");
    }
  }, [clearance, connectedDevice]);

  /*const handleDeviceConnection = async () => {
    try {
      await SecureStore.getItemAsync("pairingStatus")
      .then(value => {
        isPairedRef.current = value ?? 'false';
        //console.log("[handleDeviceConnection] Are we paired? " + isPairedRef.current);
      });

      if (isPairedRef.current === 'true') {
        if (connectedDevice === null) {
          if (pairedDeviceFound === false) {
            await retrieveDevice();
            await scanForReconnection();
          } else if (pairedDeviceFound === true) {
            await connectToDevice(null, pairedDeviceIDRef.current);
            //await writePassword(connectedDeviceRef.current, passwordRef.current);
            handleDisconnection(pairedDeviceIDRef.current);
          }
        }
      }
    } catch (error) {
      console.error(`[main] error: ${error}`);
    }
  }

  useEffect(() => {
    (async () => {
      if (isBLEAvailable) {
        handleDeviceConnection();
      }   
      return () => {
        if (connectedDevice) {
          disconnectFromDevice(connectedDevice.id)
        }
      }
    })();
  }, [pairedDeviceFound, isBLEAvailable]);*/
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
                authenticateDevice={authenticateDevice}
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

                <View style={{ marginTop: 40 }}>
                    <PasswordWidget
                      device={connectedDevice}
                      clearance={clearance}
                      authenticateDevice={authenticateDevice}
                      changeDevicePassword={changeDevicePassword}
                    />
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
  /*return (
    <KeyboardAvoidingContainer>
      <StatusBar backgroundColor="#414141" />
      <ImageBackground
        style={styles.backgroundContainer}
        resizeMode="cover"
        source={BackgroundImage}
      >
          <View style={styles.container}>
            {
              connectedDevice ? (
                <>
                  <LockControl
                    deviceRef={connectedDeviceRef}
                    buttonImage={ActivateButton}
                    lockState={lockState}
                    activateButton={activateButton}
                  />
                </>
              ) : (
                <>
                  <TouchableOpacity onPress={openModal} style={styles.regularButton}>
                    <Text style={styles.regularButtonText}>Connect</Text>
                  </TouchableOpacity>
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
    
  )*/

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: dimensions.height / 3,
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
  mainTitleWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  regularButton: {
    backgroundColor: "#C0C0C0", // Argentinian blue
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
  },
  activateButton: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 150,
    width: 150,
    marginHorizontal: 100,
    marginBottom: 10,
    borderRadius: 100,
  },
  activaButtonImage: {
    width: 150,
    height: 150,
  },
  imageContainer: {
    flex: 1,
    paddingTop: 58,
    paddingHorizontal: 20,
  },
  mainImage: {
    width: 350,
    height: 300,
    borderRadius: 0,
    resizeMode: 'contain',
  },
});

export default App;