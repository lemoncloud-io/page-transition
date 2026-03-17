<script setup lang="ts">
import { useRoute } from 'vue-router';
import { useNavigateWithTransition } from '@lemoncloud/vue-page-transition';

const route = useRoute();
const { goBack } = useNavigateWithTransition();

const id = route.params.id as string;
</script>

<template>
    <div class="detail-page">
        <header class="detail-header">
            <button class="back-btn" @click="goBack">← Back</button>
            <h1>Detail: {{ id }}</h1>
        </header>

        <main class="detail-content">
            <div class="detail-card">
                <p>
                    You navigated here with: <code>{{ id }}</code>
                </p>
                <p class="detail-hint">Press back button to see reverse transition</p>
            </div>
        </main>
    </div>
</template>

<style scoped>
.detail-page {
    min-height: 100vh;
    background: #f5f5f5;
}

.detail-header {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px;
    background: white;
    border-bottom: 1px solid #eee;
}

.detail-header h1 {
    margin: 0;
    font-size: 1.25rem;
}

.back-btn {
    padding: 8px 16px;
    background: none;
    border: none;
    color: #007aff;
    font-size: 1rem;
    cursor: pointer;
}

.detail-content {
    padding: 24px;
}

.detail-card {
    background: white;
    border-radius: 12px;
    padding: 24px;
    text-align: center;
}

.detail-card code {
    background: #1a1a1a;
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
}

.detail-hint {
    color: #888;
    margin-top: 16px;
}
</style>
