import React from 'react';
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    Image,
} from 'react-native';

const ActivateButtonImage = require('../assets/blue-button.png');

interface ActivationButtonProps {
    onPress: () => Promise<void>;
    title: string;
}

const ActivationButton: React.FC<ActivationButtonProps> = ({ onPress, title }) => {
    return (
        <TouchableOpacity
            onPress={() => {
                onPress().then(() => {
                    //
                });
            }}
            style={styles.activateButton}
        >
            <Image source={ActivateButtonImage} style={styles.activateButtonImage} />
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    activateButton: {
        justifyContent: 'center',
        alignItems: 'center',
        height: 150,
        width: 150,
        borderRadius: 100,
        marginHorizontal: 100,
        marginBottom: 10,
    },
    activateButtonImage: {
        width: 150,
        height: 150,
    },
});

export default ActivationButton;