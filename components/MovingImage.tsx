import { useRef } from "react";
import { StyleSheet, View } from "react-native";
import LottieView from 'lottie-react-native';

interface MovingImageProps {
    animation: React.MutableRefObject<LottieView>;
    source: any;
    visibility: boolean;
}

export default function MovingImage({ animation, source, visibility }: MovingImageProps) {
    return (
        <View style={styles.animationContainer}>
            <LottieView
                autoPlay={true}
                ref={animation}
                style={{
                    width: 200,
                    height: 200,
                    backgroundColor: 'rgba(192, 192, 192, 0.8)',
                    borderRadius: 100,
                    overflow: 'hidden',
                }}
                source={source}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    animationContainer: {
        backgroundColor: 'rgba(0, 0, 0, 0)',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 120,
        overflow: 'hidden',
        flex: 1,
    }
});