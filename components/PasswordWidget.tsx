import { setStatusBarStyle } from 'expo-status-bar';
import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Device } from 'react-native-ble-plx';

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
                Status: {clearance === 1 ? "Cleared" : "Locked"}
            </Text>

            <TextInput
                style={styles.input}
                value={inputValue}
                onChangeText={setInputValue}
                placeholder="Enter 6-digit password"
                maxLength={6}
                secureTextEntry={true}
            />

            {clearance === 0 ? (
                <TouchableOpacity style={styles.updateButton} onPress={handleAuth}>
                    <Text style={styles.buttonText}>Authenticate</Text>
                </TouchableOpacity>
            ) : (
                <TouchableOpacity style={styles.updateButton} onPress={handleUpdate}>
                    <Text style={styles.buttonText}>Set New Password</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 20,
        alignItems: 'center'
    },
    statusText: {
        fontSize: 18,
        marginBottom: 10,
        fontWeight: 'bold'
    },
    input: {
        height: 50,
        width: 250,
        borderWidth: 1,
        borderRadius: 8,
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
    updateButton: {
        backgroundColor: '#34C759',
        padding: 15,
        borderRadius: 8,
        width: 200,
        alignItems: 'center'
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold'
    }
});