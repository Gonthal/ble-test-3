import { useEffect, useMemo, useRef, useState } from "react";
import { PermissionsAndroid, Platform } from "react-native";

import * as ExpoDevice from "expo-device";

//import * as SecureStore from "expo-secure-store";

import  base64  from "react-native-base64";
import {
    BleError,
    BleManager,
    Device,
    BleErrorCode,
    ConnectionPriority
} from "react-native-ble-plx";

//import userSecureStore from "./userSecureStore";

const DATA_SERVICE_UUID = "E96BC595-B37B-CC90-0000-9896AC48C638"
const LOCKSTATE_CHARACTERISTIC_UUID = "E96BC595-B37B-CC90-0100-9896AC48C638"
const SWITCH_CHARACTERISTIC_UUID    = "E96BC595-B37B-CC90-0200-9896AC48C638"
const PASSWORD_CHARACTERISTIC_UUID  = "E96BC595-B37B-CC90-0300-9896AC48C638"
const CLEARANCE_CHARACTERISTIC_UUID = "E96BC595-B37B-CC90-0400-9896AC48C638"


//const DATA_SERVICE_UUID = "19B10000-E8F2-537E-4F6C-D104768A1214";
//const SWITCH_CHARACTERISTIC_UUID = "19B10001-E8F2-537E-4F6C-D104768A1214"
//const PASSWORD_CHARACTERISTIC_UUID = "19B10002-E8F2-537E-4F6C-D104768A1214";
//const CLEARANCE_CHARACTERISTIC_UUID = "19B10003-E8F2-537E-4F6C-D104768A1214";
//const LOCKSTATE_CHARACTERISTIC_UUID = "19B10004-E8F2-537E-4F6C-D104768A1214";

function useBLE() {
    const bleManager = useMemo(() => new BleManager(), []);

    const [allDevices, setAllDevices] = useState<Device[]>([]);
    const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
    const [clearance, setClearance] = useState<number>(0);
    const [isBLEAvailable, setIsBLEAvailable] = useState<boolean>(false);
    const [lockState, setLockState] = useState<number>(-1);

    let connectedDeviceRef = useRef<Device | null>(null);
    

    const [pairedDeviceID, setPairedDeviceID] = useState<string>('');

    const requestAndroid31Permissions = async () => {
        const bluetoothScanPermission = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          {
            title: "Location Permission",
            message: "Bluetooth Low Energy requires Location",
            buttonPositive: "OK",
          }
        );
        const bluetoothConnectPermission = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          {
            title: "Location Permission",
            message: "Bluetooth Low Energy requires Location",
            buttonPositive: "OK",
          }
        );
        const fineLocationPermission = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: "Location Permission",
            message: "Bluetooth Low Energy requires Location",
            buttonPositive: "OK",
          }
        );
    
        return (
          bluetoothScanPermission === "granted" &&
          bluetoothConnectPermission === "granted" &&
          fineLocationPermission === "granted"
        );
      };

    const requestPermissions = async () => {
        if (Platform.OS === "android") {
            if ((ExpoDevice.platformApiLevel ?? -1) < 31) {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                {
                title: "Location Permission",
                message: "Bluetooth Low Energy requires Location",
                buttonPositive: "OK",
                }
            );
            return granted === PermissionsAndroid.RESULTS.GRANTED;
            } else {
            const isAndroid31PermissionsGranted =
                await requestAndroid31Permissions();

            return isAndroid31PermissionsGranted;
            }
        } else {
            return true;
        }
    };

    const connectToDevice = async (device: Device | null, id: string | null) => {
        // Helper function to setup monitor
        const setupMonitor = async (device: Device) => {
            // ANDROID patch
            if (Platform.OS === "android") {
                try {
                    console.log("[Android] Negotiating connection priority and MTU...");
                    // Force the Android OS to accept a fast connection interval
                    // Then, expand the packet size to prevent GATT bottlenecks
                    await device.requestConnectionPriority(ConnectionPriority.High);
                    await device.requestMTU(512);
                } catch (error) {
                    console.log("[Android] Negotiating warning:", error);
                }
            }

            await device.discoverAllServicesAndCharacteristics();
            bleManager.stopDeviceScan();
            connectedDeviceRef.current = device;
            setConnectedDevice(device);

            bleManager.onDeviceDisconnected(device.id, (error, disconnectedDevice) => {
                console.log("[useBLE, setupMonitor] Device physically disconnected!", error);
                setConnectedDevice(null); // Clear the device
                setClearance(0);          // Reset the clearance lock
            })

            // Setup the monitor here
            console.log("[connecToDevice] Setting up notification monitor...");
            device.monitorCharacteristicForService(
                DATA_SERVICE_UUID,
                LOCKSTATE_CHARACTERISTIC_UUID,
                (error, characteristic) => {
                    if (error) {
                        if (error.errorCode === BleErrorCode.DeviceDisconnected ||
                            error.errorCode === BleErrorCode.OperationCancelled) {
                                return; // Fail silently
                            }
                        console.error("Monitor error:", error);
                        return;
                    }
                    if (characteristic?.value) {
                        const val = base64.decode(characteristic.value).charCodeAt(0);
                        console.log("[connectToDevice] Notification received. New lock state:", val);
                        setLockState(val);
                    }
                }
            );
        };

        if (id) {
            try {
                bleManager.stopDeviceScan();
                await bleManager.connectToDevice(id, { autoConnect: false })
                    .then(setupMonitor); // Use the helper
            } catch (e) {
                console.log("[connectToDevice] FAILED TO CONNECT WITH ID", e);
                //setPairedDeviceFound(false);
            }
        } else if (device) {
            try {
                bleManager.stopDeviceScan();
                await bleManager.connectToDevice(device.id, { autoConnect: false })
                    .then(setupMonitor);
            } catch (e) {
                console.log("[connectToDevice] FAILED TO CONNECT WITH ID", e);
                //setPairedDeviceFound(false);
            }
        }
    };

    const isDuplicateDevice = (devices: Device[], nextDevice: Device) =>
        devices.findIndex((device) => nextDevice.id === device.id) > -1;

    const scanForPeripherals = () => {
        bleManager.stopDeviceScan();

        bleManager.startDeviceScan(null, null, (error, device) => {
            if (error) {
                console.log("[scanForPeripherals]", error);
            }

            if (
                device //&&
                //(device.localName === "LOCK" || device.name === "LOCK")
            ) {
                setAllDevices((prevState: Device[]) => {
                    if (!isDuplicateDevice(prevState, device)) {
                        return [...prevState, device];
                    }
                    return prevState;
                });
                //bleManager.stopDeviceScan();
            }
        });
    }
        
    const activateButton = async (device: Device) => {
        //console.log("[activateButton] device:", device);
        if (device) {
            // The monitor established in connectToDevice will handle the UI update.
            device.writeCharacteristicWithResponseForService(
                DATA_SERVICE_UUID,
                SWITCH_CHARACTERISTIC_UUID,
                base64.encode('1')
            )
            .then(() => console.log("[activateButton] sent successful"))
            .catch(error => console.error("[activateButton] ERROR:", error));
            /*await checkLockCharacteristic(device, true);
            device
                .writeCharacteristicWithResponseForService(
                    DATA_SERVICE_UUID,
                    SWITCH_CHARACTERISTIC_UUID,
                    base64.encode('1')
                )
                .then(() => {
                    console.log("[activateButton] sent successful");
                })
                .catch(error => {
                    console.error("[activateButton] error", error);
                })
            
            await checkLockCharacteristic(device, false);
            if (prevLockStateRef.current != actualLockStateRef.current) {
                setDifferentLockState(true);
            } else if (prevLockStateRef.current === actualLockStateRef.current) {
                //setDifferentLockState(false);
            }*/
        }
    }

    const disconnectFromDevice = async (id: string) => {
        await bleManager.cancelDeviceConnection(id);
        setConnectedDevice(null);
        console.log('[disconnectFromDevice] device connection status:', await bleManager.isDeviceConnected(id));
    }

    const checkBLEState = async () => {
        console.log(`[BLEUseEffect] I entered`);
        //alert(`[BLEUseEffect] I entered`);
        const stateSubscription = bleManager.onStateChange(state =>{
            if (state === 'PoweredOn') {
                setIsBLEAvailable(true);
                stateSubscription.remove();
                console.log(`[checkBLEState, if] BLE state is ${state}`);
                //alert(`[checkBLEState, if] BLE state is ${state}`);
            } else {
                console.log(`[checkBLEState, else] BLE state is ${state}`);
                //alert(`[checkBLEState, else] BLE state is ${state}`);
            }
        }, true)
    }

    // Authentication function
    const authenticateDevice = async (device: Device, password: string) => {
        if (!device) return;

        try {
            // We setup a listener first so we do not miss the WBZ451 reply
            device.monitorCharacteristicForService(
                DATA_SERVICE_UUID,
                CLEARANCE_CHARACTERISTIC_UUID,
                (error, characteristic) => {
                    if (error) {
                        if (error.errorCode === BleErrorCode.DeviceDisconnected ||
                            error.errorCode === BleErrorCode.OperationCancelled) {
                                return; // Fail silently
                            }
                        console.error("Clearance error:", error);
                        return;
                    }
                    if (characteristic?.value) {
                        const status = base64.decode(characteristic.value).charCodeAt(0);
                        setClearance(status); // 1 = Cleared, 0 = Rejected
                    }
                }
            );
            // Then, we send a 6-byte password to the board
            await device.writeCharacteristicWithResponseForService(
                DATA_SERVICE_UUID,
                PASSWORD_CHARACTERISTIC_UUID,
                base64.encode(password)
            );
        } catch (error) {
            console.error("Authentication failed to send:", error);
        }
    };

    // The change password function
    const changeDevicePassword = async (device: Device, newPassword: string) => {
        if (clearance !== 1) {
            console.warn("Unauthorized: Cannot change password without clearance.");
            return false;
        } 

        try {
            // Send the new password
            await device.writeCharacteristicWithResponseForService(
                DATA_SERVICE_UUID,
                PASSWORD_CHARACTERISTIC_UUID,
                base64.encode(newPassword)
            );
            return true; // Success
        } catch (error) {
            console.error("Failed to update password:", error);
            return false;
        }
    };

    useEffect(() => {
        (async () => {
            await checkBLEState();
        })();
    }, [bleManager]);

    const autoConnectToDevice = (savedId: string, savedPassword: string) => {
        bleManager.stopDeviceScan();

        console.log("[autoConnectToDevice] Searching for saved device in background...");
        bleManager.startDeviceScan(null, null, async (error, device) => {
            if (error) {
                console.log("[autoConnectToDevice] Scan error:", error);
                return;
            }

            if (device && device.id === savedId) {
                console.log("[autoConnectToDevice] Device found! Stopping scan and connecting...");

                bleManager.stopDeviceScan();

                try {
                    await connectToDevice(device, null);
                } catch (e) {
                    console.log("[autoConnectToDevice] Connection failed:", e);
                }
            }
        });
    }

    return {
        connectToDevice,
        allDevices,
        connectedDevice,
        connectedDeviceRef,
        requestPermissions,
        scanForPeripherals,
        activateButton,
        disconnectFromDevice,
        authenticateDevice,
        changeDevicePassword,
        autoConnectToDevice,
        pairedDeviceID,
        clearance,
        isBLEAvailable,
        lockState,
    };
}

export default useBLE;