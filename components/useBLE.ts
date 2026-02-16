import { useEffect, useMemo, useRef, useState } from "react";
import { PermissionsAndroid, Platform } from "react-native";

import * as ExpoDevice from "expo-device";

import * as SecureStore from "expo-secure-store";

import  base64  from "react-native-base64";
import {
    BleError,
    BleManager,
    Characteristic,
    Device,
} from "react-native-ble-plx";

import userSecureStore from "./userSecureStore";

const DATA_SERVICE_UUID = "E96BC595-B37B-CC90-0000-9896AC48C638"
const SWITCH_CHARACTERISTIC_UUID = "E96BC595-B37B-CC90-0200-9896AC48C638"
const LOCKSTATE_CHARACTERISTIC_UUID = "E96BC595-B37B-CC90-0100-9896AC48C638"
//const DATA_SERVICE_UUID = "19B10000-E8F2-537E-4F6C-D104768A1214";
//const SWITCH_CHARACTERISTIC_UUID = "19B10001-E8F2-537E-4F6C-D104768A1214"
const PASSWORD_CHARACTERISTIC_UUID = "19B10002-E8F2-537E-4F6C-D104768A1214";
const CLEARANCE_CHARACTERISTIC_UUID = "19B10003-E8F2-537E-4F6C-D104768A1214";
//const LOCKSTATE_CHARACTERISTIC_UUID = "19B10004-E8F2-537E-4F6C-D104768A1214";

function useBLE() {
    const bleManager = useMemo(() => new BleManager(), []);

    const [allDevices, setAllDevices] = useState<Device[]>([]);
    const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
    const [clearance, setClearance] = useState<number>(0);
    const [pairedDeviceFound, setPairedDeviceFound] = useState<boolean>(false);
    const [isPaired, setIsPaired] = useState<boolean>(false);
    const [isBLEAvailable, setIsBLEAvailable] = useState<boolean>(false);
    const [differentLockState, setDifferentLockState] = useState<boolean>(false);
    const [lockState, setLockState] = useState<number>(-1);

    let connectedDeviceRef = useRef<Device | null>(null);
    let isPairedRef = useRef<string>('false');
    let pairedDeviceIDRef = useRef<string>('');
    let passwordRef = useRef<string>('');
    let clearanceRef = useRef<number>(0);
    let prevLockStateRef = useRef<number>(0);
    let actualLockStateRef = useRef<number>(0);
    

    const [pairedDeviceID, setPairedDeviceID] = useState<string>('');

    const { save, getValueFor } = userSecureStore();

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
            await device.discoverAllServicesAndCharacteristics();
            bleManager.stopDeviceScan();
            connectedDeviceRef.current = device;
            clearanceRef.current = 1;
            setConnectedDevice(device);
            setClearance(1);
            saveDevice(device, "dummy_pwd");

            // Setup the monitor here
            console.log("[connecToDevice] Setting up notification monitor...");
            device.monitorCharacteristicForService(
                DATA_SERVICE_UUID,
                LOCKSTATE_CHARACTERISTIC_UUID,
                (error, characteristic) => {
                    if (error) {
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
                setPairedDeviceFound(false);
            }
        } else {
            try {
                bleManager.stopDeviceScan();
                await bleManager.connectToDevice(device.id, { autoConnect: false })
                    .then(setupMonitor);
            } catch (e) {
                console.log("[connectToDevice] FAILED TO CONNECT WITH ID", e);
                setPairedDeviceFound(false);
            }
        }
        
        // Used to connect to already known devices, i.e., paired devices
        /*if (id) {
            console.log("[connectToDevice] id:", id);
            try {
                bleManager.stopDeviceScan();
                const deviceConnection = await bleManager.connectToDevice(id, { autoConnect: false })
                    .then(async device => {
                        await device.discoverAllServicesAndCharacteristics();
                        bleManager.stopDeviceScan();
                        connectedDeviceRef.current = device;
                        setConnectedDevice(device);
                        clearanceRef.current = 1;
                        setClearance(1);
                        saveDevice(device, "dummy_pwd");
                        device.readCharacteristicForService(DATA_SERVICE_UUID, LOCKSTATE_CHARACTERISTIC_UUID)
                            .then(characteristic => {
                                if (base64.decode(characteristic.value).charCodeAt(0) != prevLockStateRef.current) {
                                    setDifferentLockState(true);
                                } else {
                                    setDifferentLockState(false);
                                }
                                
                                //setLockState(base64.decode(characteristic.value).charCodeAt(0));
                                //console.log("[connectToDevice] Lock state value is: ", lockState);
                                //lockStateRef.current = base64.decode(characteristic.value).charCodeAt(0);
                                //console.log("[connectToDevice] Lock state value is:", lockStateRef.current);
                            })
                    });
                console.log("[connectToDevice] connection status:", await bleManager.isDeviceConnected(id));
            } catch (e) {
                console.log("[connectToDevice] FAILED TO CONNECT WITH ID", e);
                setPairedDeviceFound(false);
            }
        } else {
            try {
                bleManager.stopDeviceScan();
                const deviceConnection = await bleManager.connectToDevice(device.id, {autoConnect: true})
                    .then(async device => {
                        await device.discoverAllServicesAndCharacteristics();
                        bleManager.stopDeviceScan();
                        connectedDeviceRef.current = device;
                        setConnectedDevice(device);
                        clearanceRef.current = 1;
                        setClearance(1);
                        saveDevice(device, "dummy_pwd");
                    })
            } catch (e) {
                console.log("[connectToDevice] FAILED TO CONNECT", e);
                setPairedDeviceFound(false);
            }
        }*/

    };

    const isDuplicateDevice = (devices: Device[], nextDevice: Device) =>
        devices.findIndex((device) => nextDevice.id === device.id) > -1;

    const scanForPeripherals = () => 
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
                bleManager.stopDeviceScan();
            }
        });

    const scanForReconnection = () => 
        bleManager.startDeviceScan(null, null, (error, device) => {
            if (error) {
                console.log('[scanForReconnection]', error);
                //alert(`[scanForReconnection] ${error}`);
                //bleManager.stopDeviceScan();
            }
            console.log(`[scanForReconnection] ID current: ${pairedDeviceIDRef.current} | p. device found: ${pairedDeviceFound}`);
            //alert(`[scanForReconnection] ID current: ${pairedDeviceIDRef.current} | p. device found: ${pairedDeviceFound}`)
            if (device && device.id === pairedDeviceIDRef.current) {
                //console.log(`[scanForReconnection] I'm in!`);
                setPairedDeviceFound(true);
                console.log(`[scanForReconnection] I'm in, p. device found: ${pairedDeviceFound}`);
                //alert(`[scanForReconnection] I'm in, p. device found: ${pairedDeviceFound}`);
                bleManager.stopDeviceScan();
            }
        });

    const reconnectionListener = async (error: BleError | null, device: Device | null) => {
        if (error) {
            console.log('[scanForReconnection]', error);
            //alert(`[scanForReconnection] ${error}`);
        }
        console.log(`[scanForReconnection] ID current: ${pairedDeviceIDRef.current} | p. device found: ${pairedDeviceFound}`);
        //alert(`[scanForReconnection] ID current: ${pairedDeviceIDRef.current} | p. device found: ${pairedDeviceFound}`);
        if (device && device.id == pairedDeviceIDRef.current) {
            setPairedDeviceFound(true);
            console.log(`[scanForReconnection] I'm in, p. device found: ${pairedDeviceFound}`);
            //alert(`[scanForReconnection] I'm in, p. device found: ${pairedDeviceFound}`);
            bleManager.stopDeviceScan();
        }
    }

    const readClearanceCharacteristic = async (device: Device, password: string) => {
        if (device) {
            await device
                .readCharacteristicForService(DATA_SERVICE_UUID, CLEARANCE_CHARACTERISTIC_UUID)
                .then(characteristic => {
                    clearanceRef.current = base64.decode(characteristic.value).charCodeAt(0);
                    setClearance(clearanceRef.current);
                    console.log("[readClearanceCharacteristic] clearanceRef is:", clearanceRef.current);
                    console.log('[readClearanceCharacteristic] clearance type is:', typeof(clearanceRef.current));

                    saveDevice(device, password);
                })
                .catch(error => {
                    console.error('[readClearanceCharacteristic] Read characteristic error: ', error);
                })
        }
    }

    const writePassword = async (device: Device, password: string) => {
        if (device) {
            clearanceRef.current = 1;
            setClearance(1);
            saveDevice(device, "dummy_pwd");
            /*await device.
                writeCharacteristicWithResponseForService(
                    DATA_SERVICE_UUID,
                    PASSWORD_CHARACTERISTIC_UUID,
                    base64.encode(password));
                console.log("[writePassword] Write successful");
                readClearanceCharacteristic(device, password);*/
            
        } else {
            console.log("[writePassword] no device connected");
        }
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

    async function queryLockState(device: Device): Promise<boolean | number> {
        let decodedValue = 0;
        if (device) {
            await device.readCharacteristicForService(DATA_SERVICE_UUID, LOCKSTATE_CHARACTERISTIC_UUID)
                .then(characteristic => {
                    decodedValue = base64.decode(characteristic.value).charCodeAt(0);
                })
        }
        return new Promise((resolve) => {
            resolve(decodedValue);
        });
    };
    /*const queryLockState = async (device: Device) => {
        if (device) {
            try {
                device.monitorCharacteristicForService(
                    DATA_SERVICE_UUID,
                    LOCKSTATE_CHARACTERISTIC_UUID,
                    (error, LOCKSTATE_CHARACTERISTIC_UUID) => {
                        if (error) {
                            alert("[queryLockState] The error is" + error);
                        } else {
                            setDifferentLockState(true)
                        }
                    }
                )
            }
        }
    }*/

    const checkLockCharacteristic = async (device: Device, prevFlag: boolean) => {
        if (device) {
            await device.readCharacteristicForService(DATA_SERVICE_UUID, LOCKSTATE_CHARACTERISTIC_UUID)
                .then(characteristic => {
                    if (prevFlag === true) {
                        prevLockStateRef.current = base64.decode(characteristic.value).charCodeAt(0);
                    } else {
                        actualLockStateRef.current = base64.decode(characteristic.value).charCodeAt(0);
                    }
                });
            //console.log(`[checkLockCharacteristic] previous: ${prevLockStateRef.current} actual: ${actualLockStateRef.current} and different: ${differentLockState}`);
        }
    }

    const saveDevice = async (device: Device, password: string) => {
        if (clearanceRef.current) {
            console.log('[saveDevice] Saving device...');
            isPairedRef.current = 'true';
            setIsPaired(true);
            await save("deviceID", device.id);
            await save("password", password);
            await save("pairingStatus", isPairedRef.current);
            console.log('[saveDevice] Device has been saved.');
            //console.log(getValueFor("deviceID"));
            //console.log(getValueFor("password"));
            //console.log(getValueFor("pairingStatus"));
        } else {
            console.error('[saveDevice] Clearance is needed.');
        }
    }

    const deleteDevice = async () => {
        //await bleManager.cancelDeviceConnection(pairedDeviceIDRef.current);
        await SecureStore.deleteItemAsync("deviceID");
        await SecureStore.deleteItemAsync("password");
        await SecureStore.deleteItemAsync("pairingStatus");
        isPairedRef.current = 'false';
        setIsPaired(false);
        pairedDeviceIDRef.current = '';
        passwordRef.current = '';
        console.log(`[deleteDevice]
            ${SecureStore.getItemAsync("deviceID")},
            ${SecureStore.getItemAsync("password")},
            ${SecureStore.getItemAsync("pairingStatus")}.`
        );
    }

    const retrieveDevice = async () => {
        //scanForPeripherals();
        //alert('[retrieveDevice]');

        try {
            await SecureStore.getItemAsync("deviceID")
            .then(value => {
                //console.log('[retrieveDevice, get ID] id:', value);
                pairedDeviceIDRef.current = value;
            });
            
            await SecureStore.getItemAsync("password")
            .then(value => {
                //console.log('[retrieveDevice, get password] password is:', value);
                passwordRef.current = value;
            });
            //console.log('[retrieveDevice] password ref:', passwordRef.current);

            console.log(`[retrieveDevice] Ref ID: ${pairedDeviceIDRef.current} and Ref password: ${passwordRef.current}`);
            //alert(`[retrieveDevice] Ref ID: ${pairedDeviceIDRef.current} and Ref password: ${passwordRef.current}`);
        } catch (error) {
            console.log(`[retrieveDevice] error: ${error}`);
            //alert(`[retrieveDevice] error: ${error}.`);
        }
    }

    const disconnectFromDevice = async (id: string) => {
        await bleManager.cancelDeviceConnection(id);
        setConnectedDevice(null);
        console.log('[disconnectFromDevice] device connection status:', await bleManager.isDeviceConnected(id));
    }

    const handleDisconnection = async (id: string) => {
        console.log('[handleDisconnection]');
        bleManager.onDeviceDisconnected(id, disconnectedListener);
    }

    const disconnectedListener = (error: BleError | null, device: Device | null) => {
        if (error) {
            console.error('[disconnectedListener] error:', error);
            setConnectedDevice(null);
            setPairedDeviceFound(false);
        } else if (device) {
            console.log('[disconnectedListener] device:', device);
            setConnectedDevice(null);
            setPairedDeviceFound(false);
        }
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

    useEffect(() => {
        (async () => {
            await checkBLEState();
        })();
    }, [bleManager]);

    return {
        connectToDevice,
        allDevices,
        connectedDevice,
        connectedDeviceRef,
        requestPermissions,
        scanForPeripherals,
        scanForReconnection,
        readClearanceCharacteristic,
        writePassword,
        activateButton,
        queryLockState,
        saveDevice,
        deleteDevice,
        retrieveDevice,
        disconnectFromDevice,
        handleDisconnection,
        pairedDeviceID,
        isPairedRef,
        isPaired,
        pairedDeviceIDRef,
        passwordRef,
        clearanceRef,
        clearance,
        pairedDeviceFound,
        isBLEAvailable,
        differentLockState,
        setDifferentLockState,
        lockState,
    };
}

export default useBLE;