import {
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
} from 'react-native';

const KeyboardAvoidingContainer = ({ children }) => {
    return (
        <SafeAreaView style={Styles.safeAreaContainer}>
            <KeyboardAvoidingView
                style={{flex: 1}}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ flexGrow: 1}}
            >
                {children}
            </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    )
}

const Styles = StyleSheet.create({
    safeAreaContainer: {
        flex: 1,
        backgroundColor: '#424B54',
    }
})

export default KeyboardAvoidingContainer;