import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { DOCUMENT } from '@angular/common';

type AnimationType = 'slide' | 'lift' | 'fade' | 'zoom';

@Component({
    selector: 'app-home',
    standalone: true,
    template: `
        <div class="app">
            <header class="app-header">
                <h1>&#64;lemoncloud/page-transition-core</h1>
                <p class="app-subtitle">Angular + View Transitions API</p>
            </header>

            <main class="app-main">
                <section class="section">
                    <h2>Animation Types</h2>
                    <p class="section-desc">
                        Angular uses <code>withViewTransitions()</code> - just add our CSS!
                    </p>
                    <div class="animation-grid">
                        @for (anim of animations; track anim.type) {
                            <button class="animation-card" (click)="navigateTo(anim.type)">
                                <span class="animation-icon">{{ anim.icon }}</span>
                                <span class="animation-title">{{ anim.title }}</span>
                                <span class="animation-desc">{{ anim.desc }}</span>
                            </button>
                        }
                    </div>
                </section>

                <section class="section">
                    <h2>How It Works</h2>
                    <div class="code-block">
                        <pre>// main.ts
provideRouter(routes, withViewTransitions())

// styles.css (or angular.json)
&#64;import '&#64;lemoncloud/page-transition-core/styles.css';</pre>
                    </div>
                </section>
            </main>

            <footer class="config-bar">
                <span class="config-label">Platform:</span>
                <div class="config-buttons">
                    <button
                        class="config-btn"
                        [class.active]="platform === 'auto'"
                        (click)="setPlatform('auto')"
                    >
                        Auto
                    </button>
                    <button
                        class="config-btn"
                        [class.active]="platform === 'ios'"
                        (click)="setPlatform('ios')"
                    >
                        iOS
                    </button>
                    <button
                        class="config-btn"
                        [class.active]="platform === 'android'"
                        (click)="setPlatform('android')"
                    >
                        Android
                    </button>
                </div>
            </footer>
        </div>
    `,
    styles: [`
        .app {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
        }

        .app-header {
            text-align: center;
            padding: 32px 16px;
            background: white;
            border-bottom: 1px solid #eee;
        }

        .app-header h1 {
            font-size: 1.5rem;
            color: #1a1a1a;
        }

        .app-subtitle {
            color: #666;
            margin-top: 8px;
        }

        .app-main {
            flex: 1;
            padding: 24px;
        }

        .section {
            margin-bottom: 32px;
        }

        .section h2 {
            font-size: 1.25rem;
            margin-bottom: 8px;
            color: #333;
        }

        .section-desc {
            color: #666;
            margin-bottom: 16px;
        }

        .section-desc code {
            background: #f0f0f0;
            padding: 2px 6px;
            border-radius: 4px;
        }

        .animation-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
        }

        .animation-card {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 20px;
            background: white;
            border: none;
            border-radius: 12px;
            cursor: pointer;
            transition: transform 0.2s;
        }

        .animation-card:hover {
            transform: scale(1.02);
        }

        .animation-icon {
            font-size: 2rem;
            margin-bottom: 8px;
        }

        .animation-title {
            font-weight: 600;
            color: #333;
        }

        .animation-desc {
            font-size: 0.875rem;
            color: #888;
        }

        .code-block {
            background: #1a1a1a;
            border-radius: 12px;
            padding: 16px;
            overflow-x: auto;
        }

        .code-block pre {
            color: #fff;
            font-family: 'Monaco', 'Menlo', monospace;
            font-size: 0.875rem;
            margin: 0;
        }

        .config-bar {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            padding: 16px;
            background: white;
            border-top: 1px solid #eee;
        }

        .config-label {
            color: #666;
        }

        .config-buttons {
            display: flex;
            gap: 8px;
        }

        .config-btn {
            padding: 8px 16px;
            border: 1px solid #ddd;
            border-radius: 8px;
            background: white;
            cursor: pointer;
        }

        .config-btn.active {
            background: #007aff;
            color: white;
            border-color: #007aff;
        }
    `],
})
export class HomeComponent {
    private router = inject(Router);
    private document = inject(DOCUMENT);

    platform: 'auto' | 'ios' | 'android' = 'auto';

    animations: { type: AnimationType; icon: string; title: string; desc: string }[] = [
        { type: 'slide', icon: '➡️', title: 'Slide', desc: 'iOS-style horizontal' },
        { type: 'lift', icon: '⬆️', title: 'Lift', desc: 'Android-style vertical' },
        { type: 'fade', icon: '✨', title: 'Fade', desc: 'Crossfade transition' },
        { type: 'zoom', icon: '🔍', title: 'Zoom', desc: 'Scale + fade' },
    ];

    navigateTo(animationType: AnimationType) {
        // Add animation class before navigation
        this.document.documentElement.classList.add(`animation-${animationType}`);
        this.router.navigate(['/detail', animationType]);
    }

    setPlatform(platform: 'auto' | 'ios' | 'android') {
        this.platform = platform;

        // Update platform class on document
        this.document.documentElement.classList.remove('android');
        if (platform === 'android') {
            this.document.documentElement.classList.add('android');
        }
    }
}
