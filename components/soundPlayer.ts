import { useAudioPlayer } from "expo-audio";


function soundPlayer() {
    const audioSource = require('../assets/electric-drill.mp3');
    const player = useAudioPlayer(audioSource);
    

    return { player };
}

export default soundPlayer;