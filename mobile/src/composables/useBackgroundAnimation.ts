import { ref } from 'vue';

const speedMultiplier = ref(1);

export function useBackgroundAnimation() {
    const setSpeed = (speed: number) => {
        speedMultiplier.value = speed;
    };

    return {
        speedMultiplier,
        setSpeed
    };
}
