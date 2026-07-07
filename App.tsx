import React, { useState, useEffect, createContext, useContext } from "react";
import {
  Dimensions,
  ImageBackground,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
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

// 1. Initialize the Navigation Stack and the BLE Context
const Stack = createNativeStackNavigator();
const BLEContext = createContext<any>(null);

// ==========================================
// SCREEN 1: HOME SCREEN
// ==========================================
const HomeScreen = ({ navigation }: any) => {
  const {
    connectedDevice, clearance, connectToDevice, allDevices,
    requestPermissions, scanForPeripherals, activateButton,
    lockState, connectedDeviceRef, handleManualAuth, save
  } = useContext(BLEContext);

  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);

  const openModal = async () => {
    const isPermissionsEnabled = await requestPermissions();
    if (isPermissionsEnabled) {
      scanForPeripherals();
      setIsModalVisible(true);
    }
  };

  const hideModal = () => {
    setIsModalVisible(false);
    if (connectedDevice) save("deviceID", connectedDevice.id);
  };

  return (
    <KeyboardAvoidingContainer>
      <ImageBackground style={styles.backgroundContainer} source={BackgroundImage}>
        <View style={styles.container}>
          {
            !connectedDevice ? (
              <TouchableOpacity onPress={openModal} style={styles.regularButton}>
                <Text style={styles.regularButtonText}>Connect to Pedal</Text>
              </TouchableOpacity>
            )
            : clearance === 0 ? (
              <PasswordWidget
                device={connectedDevice}
                clearance={clearance}
                authenticateDevice={handleManualAuth}
                changeDevicePassword={async (device, newPass) => false} // Disabled on Home Screen
              />
            )
            : (
              <LockControl
                deviceRef={connectedDeviceRef}
                buttonImage={ActivateButton}
                lockState={lockState}
                activateButton={activateButton}
              />
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
  );
};

// ==========================================
// SCREEN 2: SETTINGS SCREEN
// ==========================================
const SettingsScreen = () => {
  const { 
    connectedDevice, clearance, handleManualAuth, 
    changeDevicePassword, handleForgetDevice 
  } = useContext(BLEContext);

  return (
    <KeyboardAvoidingContainer>
      <ImageBackground style={styles.backgroundContainer} source={BackgroundImage}>
        <View style={styles.container}>
          
          {/* Only show change password if connected and unlocked */}
          {connectedDevice && clearance === 1 && (
            <View style={{ marginBottom: 40 }}>
              <PasswordWidget
                device={connectedDevice}
                clearance={clearance}
                authenticateDevice={handleManualAuth}
                changeDevicePassword={changeDevicePassword}
              />
            </View>
          )}

          <TouchableOpacity style={styles.dangerButton} onPress={handleForgetDevice}>
            <Text style={styles.regularButtonText}>Forget Device</Text>
          </TouchableOpacity>
          
        </View>
      </ImageBackground>
    </KeyboardAvoidingContainer>
  );
};

// ==========================================
// MASTER APP WRAPPER (THE ORCHESTRATOR)
// ==========================================
const App = () => {
  const bleData = useBLE();
  const { save, getValueFor } = userSecureStore();
  const [hasAttemptedAutoAuth, setHasAttemptedAutoAuth] = useState<boolean>(false);

  // --- Core BLE Background Logic ---
  useEffect(() => {
    const autoConnect = async () => {
      try {
        const savedId = await getValueFor("deviceID");
        const isPaired = await getValueFor("pairingStatus");
        if (savedId && isPaired === 'true') {
          const savedPassword = await getValueFor("password");
          bleData.autoConnectToDevice(savedId, savedPassword ?? '');
        }
      } catch (error) {
        console.error("[main] Failed to auto-connect", error);
      }
    }
    if (bleData.isBLEAvailable && !bleData.connectedDevice) autoConnect();
  }, [bleData.isBLEAvailable, bleData.connectedDevice]);

  useEffect(() => {
    if (bleData.connectedDevice && bleData.clearance === 1) {
      save("deviceID", bleData.connectedDevice.id);
      save("pairingStatus", "true");
    }
  }, [bleData.clearance, bleData.connectedDevice]);

  useEffect(() => {
    const attemptAutoAuth = async () => {
      if (bleData.connectedDevice && bleData.clearance === 0 && !hasAttemptedAutoAuth) {
        setHasAttemptedAutoAuth(true);
        const savedPass = await getValueFor("password");
        if (savedPass) {
          bleData.authenticateDevice(bleData.connectedDevice, savedPass);
        }
      }
    };
    attemptAutoAuth();
  }, [bleData.connectedDevice, bleData.clearance, hasAttemptedAutoAuth]);

  useEffect(() => {
    if (!bleData.connectedDevice) setHasAttemptedAutoAuth(false);
  }, [bleData.connectedDevice]);

  // --- Custom Context Functions ---
  const handleManualAuth = (device: Device, pass: string) => {
    save("password", pass);
    bleData.authenticateDevice(device, pass);
  };

  const handleForgetDevice = async () => {
    await SecureStore.deleteItemAsync("deviceID");
    await SecureStore.deleteItemAsync("pairingStatus");
    await SecureStore.deleteItemAsync("password");
    if (bleData.connectedDevice) {
      bleData.disconnectFromDevice(bleData.connectedDevice.id);
    }
    alert("Pedal Lock device completely forgotten");
  };

  // Combine hooks and custom functions to pass down
  const contextValue = {
    ...bleData,
    save,
    handleManualAuth,
    handleForgetDevice
  };

  return (
    <BLEContext.Provider value={contextValue}>
      <NavigationContainer>
        <StatusBar backgroundColor="#414141" barStyle="light-content" />
        <Stack.Navigator
           screenOptions={{
             headerStyle: { backgroundColor: '#414141' },
             headerTintColor: '#F9F9F9',
             headerShadowVisible: false, 
           }}
        >
          <Stack.Screen 
            name="Home" 
            component={HomeScreen} 
            options={({ navigation }) => ({
              title: "Pedal Lock",
              headerRight: () => (
                <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
                  <Text style={{ color: '#F9F9F9', fontSize: 16, fontWeight: 'bold' }}>Settings</Text>
                </TouchableOpacity>
              ),
            })}
          />
          <Stack.Screen 
            name="Settings" 
            component={SettingsScreen} 
            options={{ title: "Configuration" }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </BLEContext.Provider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: dimensions.height / 2.5,
    paddingBottom: 20,
    alignItems: 'center',
  },
  backgroundContainer: {
    flex: 1,
    width: dimensions.width,
    height: dimensions.height,
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
  dangerButton: {
    backgroundColor: "#B22222", // A nice deep red
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
    color: "#F9F9F9",
  }
});

export default App;