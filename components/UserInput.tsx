import React, { useState } from 'react';
import {
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity
} from 'react-native';

import * as SecureStore from "expo-secure-store";

import userSecureStore from './userSecureStore';

export default function UserInput({ connectedDevice, writePassword, isPaired }) {

    const [userText, setUserText] = useState<string>('');
    const [changePassword, setChangePassword] = useState<boolean>(false);
    const [prevPasswordGood, setPrevPasswordGood] = useState<boolean>(false);

    const { save, getValueFor } = userSecureStore();

    const checkPassword = async (input) => {
        try {
            await SecureStore.getItemAsync("password")
            .then(value => {
                if (input === value) {
                    setPrevPasswordGood(true);
                } else {
                    setPrevPasswordGood(false);
                }
            }); 
        } catch (error) {
            alert(`[checkPassword] error: ${error}`);
        }
    }

    return (
        isPaired === true ? (
            changePassword === true ? (
                prevPasswordGood === true ? (
                    <>
                    <TextInput
                        style={styles.input}
                        onChangeText={setUserText}
                        value={userText}
                        placeholder='Enter your new password...'
                        placeholderTextColor='#F9F9F9'
                    />
                    <TouchableOpacity
                        onPress={() => {
                            writePassword(connectedDevice, userText);
                            save("devicePassword", userText);
                            setChangePassword(false);
                            setPrevPasswordGood(false);
                            setUserText('');
                        }}
                        style={styles.regularButton}
                    >
                        <Text style={styles.regularButtonText}>Send new password</Text>
                    </TouchableOpacity>
                    </>
                ) : (
                    <>
                    <TextInput
                        style={styles.input}
                        onChangeText={setUserText}
                        value={userText}
                        placeholder='Confirm your current password'
                        placeholderTextColor='#F9F9F9'
                    />
                    <TouchableOpacity
                        onPress={() => {
                            checkPassword(userText);
                        }}
                        style={styles.regularButton}
                    >
                        <Text style={styles.regularButtonText}>Enter current password</Text>
                    </TouchableOpacity>
                    </>
                )
            ) : (
                <TouchableOpacity
                    onPress={() => {
                        setChangePassword(true);
                    }}
                    style={styles.regularButton}>
                    <Text style={styles.regularButtonText}>Change password</Text>
                </TouchableOpacity>
            )
        ) : (
            <>
            <TextInput
                style={styles.input}
                onChangeText={setUserText}
                value={userText}
                placeholder='Enter your password...'
                placeholderTextColor='#F9F9F9'
            />
            <TouchableOpacity
                onPress={() => {
                    writePassword(connectedDevice, userText);
                    save("devicePassword", userText);
                    setUserText('');
                }}
                style={styles.regularButton}
            >
                <Text style={styles.regularButtonText}>Send password</Text>
            </TouchableOpacity>
            </>
        )
    )
};

const styles = StyleSheet.create({
    input: {
        height: 40,
        margin: 12,
        borderWidth: 1,
        padding: 10,
        color: '#F9F9F9',
        borderColor: '#5AA9E6',
        //flex: 1,
    },
    regularButton: {
        backgroundColor: "#C0C0C0",
        justifyContent: "center",
        alignItems: "center",
        height: 60,
        marginHorizontal: 20,
        marginBottom: 5,
        borderRadius: 8,
      },
      regularButtonText: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#F9F9F9",
      },
});

//export default UserInput;