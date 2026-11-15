<template>
    <div class="asset-navigator-skeleton" aria-hidden="true">
        <div class="skeleton-field" v-for="item in items" :key="item">
            <div class="skeleton-label shimmer"></div>
            <div class="skeleton-input-row">
                <div class="skeleton-value shimmer"></div>
                <span class="mdi mdi-chevron-down skeleton-chevron"></span>
            </div>
            <div class="skeleton-underline"></div>
        </div>
    </div>
</template>

<script setup lang="ts">
defineProps<{
    items: number
}>();
</script>

<style scoped lang="scss">
.asset-navigator-skeleton {
    display: flex;
    flex-wrap: wrap;
    column-gap: 12px;
    row-gap: 8px;
    width: 100%;
}

.skeleton-field {
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    width: 260px;
    height: 56px;
    flex-shrink: 0;
    padding: 4px 0 0;
    box-sizing: border-box;
}

.skeleton-label {
    width: 72px;
    height: 10px;
    border-radius: 4px;
    margin-bottom: 6px;
}

.skeleton-input-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 4px;
}

.skeleton-value {
    width: 120px;
    height: 12px;
    border-radius: 4px;
}

.skeleton-chevron {
    font-size: 18px;
    color: rgba(var(--v-theme-primary), 1);
    opacity: 0.4;
    line-height: 1;
}

.skeleton-underline {
    height: 1px;
    background: rgba(var(--v-theme-on-surface), 0.24);
    width: 100%;
}

.shimmer {
    position: relative;
    overflow: hidden;
    background: rgba(var(--v-theme-on-surface), 0.1);

    &::after {
        content: '';
        position: absolute;
        inset: 0;
        transform: translateX(-100%);
        background: linear-gradient(
            90deg,
            rgba(var(--v-theme-on-surface), 0),
            rgba(var(--v-theme-on-surface), 0.14),
            rgba(var(--v-theme-on-surface), 0)
        );
        animation: shimmer 1.4s ease-in-out infinite;
    }
}

@keyframes shimmer {
    100% {
        transform: translateX(100%);
    }
}

@media (max-width: 640px) {
    .skeleton-field {
        width: 100%;
    }
}
</style>