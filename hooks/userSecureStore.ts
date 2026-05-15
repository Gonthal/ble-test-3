import { StyleSheet } from "react-native";
import * as SecureStore from 'expo-secure-store';

function userSecureStore() {
    const save = async (key: string, value: string) => {
        await SecureStore.setItemAsync(key, value);
    }

    const getValueFor = async (key: string) => {
        let result = await SecureStore.getItemAsync(key)
        if (result) {
            return result;
        } else {
            ;//alert("There is no such value");
        }
    }

    return {
        save,
        getValueFor,
    }
}

export default userSecureStore;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        paddingTop: 10,
        backgroundColor: '#ecf0f1',
        padding: 8,
    },
    paragraph: {
        marginTop: 34,
        margin: 24,
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    textInput: {
        height: 35,
        borderColor: 'gray',
        borderWidth: 0.5,
        padding: 4,
    },
});