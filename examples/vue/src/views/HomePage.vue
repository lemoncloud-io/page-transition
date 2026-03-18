<script setup lang="ts">
import { ref } from 'vue';
import { useNavigateWithTransition } from '@lemoncloud/vue-page-transition';
import type { PlatformType, AnimationType } from '@lemoncloud/vue-page-transition';

const platform = ref<PlatformType | 'auto'>('auto');
const { navigate } = useNavigateWithTransition({
    platform: platform.value === 'auto' ? undefined : platform.value,
});

const animations: { type: AnimationType; icon: string; title: string; desc: string }[] = [
    { type: 'slide', icon: '➡️', title: 'Slide', desc: 'iOS-style horizontal' },
    { type: 'lift', icon: '⬆️', title: 'Lift', desc: 'Android-style vertical' },
    { type: 'fade', icon: '✨', title: 'Fade', desc: 'Crossfade transition' },
    { type: 'zoom', icon: '🔍', title: 'Zoom', desc: 'Scale + fade' },
];

const setPlatform = (p: PlatformType | 'auto') => {
    platform.value = p;
};
</script>

<template>
    <div class="app">
        <header class="app-header">
            <h1>@lemoncloud/vue-page-transition</h1>
            <p class="app-subtitle">iOS/Android style page transitions for Vue</p>
        </header>

        <main class="app-main">
            <section class="section">
                <h2>Animation Types</h2>
                <div class="animation-grid">
                    <button
                        v-for="anim in animations"
                        :key="anim.type"
                        class="animation-card"
                        @click="navigate(`/detail/${anim.type}`, { animation: anim.type })"
                    >
                        <span class="animation-icon">{{ anim.icon }}</span>
                        <span class="animation-title">{{ anim.title }}</span>
                        <span class="animation-desc">{{ anim.desc }}</span>
                    </button>
                </div>
            </section>

            <section class="section">
                <h2>Platform Demo</h2>
                <div class="demo-buttons">
                    <button class="demo-btn ios" @click="navigate('/detail/ios', { animation: 'slide' })">
                        iOS Slide
                    </button>
                    <button class="demo-btn android" @click="navigate('/detail/android', { animation: 'lift' })">
                        Android Lift
                    </button>
                </div>
            </section>
        </main>

        <footer class="config-bar">
            <span class="config-label">Platform:</span>
            <div class="config-buttons">
                <button
                    :class="['config-btn', { active: platform === 'auto' }]"
                    @click="setPlatform('auto')"
                >
                    Auto
                </button>
                <button
                    :class="['config-btn', { active: platform === 'ios' }]"
                    @click="setPlatform('ios')"
                >
                    iOS
                </button>
                <button
                    :class="['config-btn', { active: platform === 'android' }]"
                    @click="setPlatform('android')"
                >
                    Android
                </button>
            </div>
        </footer>
    </div>
</template>
