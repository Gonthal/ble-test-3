import { setStatusBarStyle } from 'expo-status-bar';
import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import { Device } from 'react-native-ble-plx';

const dimensions = Dimensions.get("window");

interface PasswordWdigetProps {
    device: Device | null;
    clearance: number;
    authenticateDevice: (device: Device, pass: string) => void;
    changeDevicePassword: (device: Device, newPass: string) => Promise<boolean>;
}

export default function PasswordWidget({
    device,
    clearance,
    authenticateDevice,
    changeDevicePassword
}: PasswordWdigetProps) {
    const [inputValue, setInputValue] = useState('');

    const handleAuth = () => {
        if (device && inputValue.length == 6) {
            authenticateDevice(device, inputValue);
            setInputValue(''); // Clear input after sending
        } else {
            alert("Password must be exactly 6 characters.");
        }
    };

    const handleUpdate = async () => {
        if (device && inputValue.length === 6) {
            const success = await changeDevicePassword(device, inputValue);
            if (success) {
                alert("Password updated successfully!");
                setInputValue('');
            }
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.statusText}>
                {clearance === 1 ? "You can operate the Pedal Lock" : "Password needed"}
            </Text>

            <TextInput
                style={styles.input}
                value={inputValue}
                onChangeText={setInputValue}
                placeholder="Enter 6-digit password"
                placeholderTextColor={'#000000'}
                maxLength={6}
                secureTextEntry={true}
            />

            {clearance === 0 ? (
                <TouchableOpacity style={styles.regularButton} onPress={handleAuth}>
                    <Text style={styles.regularButtonText}>Authenticate</Text>
                </TouchableOpacity>
            ) : (
                <TouchableOpacity style={styles.regularButton} onPress={handleUpdate}>
                    <Text style={styles.regularButtonText}>Set New Password</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 0,
        alignItems: 'center'
    },
    statusText: {
        fontSize: 18,
        marginBottom: 10,
        fontWeight: 'bold',
        color: 'white',
    },
    input: {
        height: 50,
        width: 250,
        borderWidth: 1,
        borderRadius: 8,
        borderColor: '#F9F9F9',
        backgroundColor: '#F0F0F0',
        padding: 10,
        marginBottom: 15,
        textAlign: 'center'
    },
    authButton: {
        backgroundColor: '#007AFF',
        padding: 15,
        borderRadius: 8,
        width: 200,
        alignItems: 'center'
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
        color: "#F9F9F9",
        fontWeight: 'bold'
    }
});