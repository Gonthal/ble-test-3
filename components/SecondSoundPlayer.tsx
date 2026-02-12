import { View, StyleSheet, Button } from 'react-native';
import { useAudioPlayer } from 'expo-audio';

const audioSource = require('../assets/electric-drill.mp3');

export default function SecondSoundPlayer() {
    const player = useAudioPlayer(audioSource);

    return (
        <View style={styles.container}>
            <Button title="Play Sound" onPress={async () => {
                await player.seekTo(0).then(() => { player.play() });
                //player.play();
            }} />
        </View>
    );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#ecf0f1',
    padding: 10,
  },
});
