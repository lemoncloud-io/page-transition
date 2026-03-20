import { useState } from 'react';
import { useNavigateWithTransition } from '@lemoncloud/react-page-transition';

import { DemoCard } from '../components';
import { usePlatformContext } from '../context';

const DURATION_OPTIONS = [100, 200, 350, 500, 800];
const EASING_OPTIONS = [
    { label: 'ease-out', value: 'ease-out' },
    { label: 'ease-in-out', value: 'ease-in-out' },
    { label: 'linear', value: 'linear' },
    { label: 'iOS curve', value: 'cubic-bezier(0.32, 0.72, 0, 1)' },
    { label: 'spring', value: 'cubic-bezier(0.34, 1.56, 0.64, 1)' },
];

export const CustomizeTab = () => {
    const { platform } = usePlatformContext();
    const navigate = useNavigateWithTransition({ platform });

    const [duration, setDuration] = useState(350);
    const [easing, setEasing] = useState('ease-out');

    return (
        <div className="tab-content">
            <div className="tab-header">
                <h2>Customization</h2>
                <p>Override animation timing per-navigation or globally</p>
            </div>

            <DemoCard
                title="Per-Navigation Override"
                description="Set duration and easing for a single navigation"
                code={`navigate('/page', {\n  customization: { duration: ${duration}, easing: '${easing}' }\n});`}
            >
                <div className="customize-controls">
                    <div className="customize-field">
                        <label className="customize-label">Duration</label>
                        <div className="customize-options">
                            {DURATION_OPTIONS.map((ms) => (
                                <button
                                    key={ms}
                                    className={`customize-chip ${duration === ms ? 'active' : ''}`}
                                    onClick={() => setDuration(ms)}
                                >
                                    {ms}ms
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="customize-field">
                        <label className="customize-label">Easing</label>
                        <div className="customize-options">
                            {EASING_OPTIONS.map((opt) => (
                                <button
                                    key={opt.value}
                                    className={`customize-chip ${easing === opt.value ? 'active' : ''}`}
                                    onClick={() => setEasing(opt.value)}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="demo-btn-group" style={{ marginTop: 12 }}>
                    <button
                        className="demo-btn ios"
                        onClick={() => navigate('/detail/custom-slide', {
                            animation: 'slide',
                            customization: { duration, easing },
                        })}
                    >
                        Slide
                    </button>
                    <button
                        className="demo-btn android"
                        onClick={() => navigate('/detail/custom-lift', {
                            animation: 'lift',
                            customization: { duration, easing },
                        })}
                    >
                        Lift
                    </button>
                    <button
                        className="demo-btn"
                        onClick={() => navigate('/detail/custom-fade', {
                            animation: 'fade',
                            customization: { duration, easing },
                        })}
                    >
                        Fade
                    </button>
                </div>
            </DemoCard>

            <DemoCard
                title="CSS Custom Properties"
                description="Override globally via CSS variables (no JS needed)"
                code={`:root {\n  --pt-slide-duration: 500ms;\n  --pt-slide-easing: ease-in-out;\n  --pt-fade-duration: 300ms;\n}`}
            >
                <p className="customize-hint">
                    Add these CSS variables to your stylesheet to change defaults for all navigations.
                </p>
            </DemoCard>

            <DemoCard
                title="Compare: Default vs Custom"
                description="See the difference side by side"
            >
                <div className="demo-btn-group">
                    <button
                        className="demo-btn secondary"
                        onClick={() => navigate('/detail/default')}
                    >
                        Default (350ms)
                    </button>
                    <button
                        className="demo-btn primary"
                        onClick={() => navigate('/detail/slow', {
                            customization: { duration: 800, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' },
                        })}
                    >
                        Slow Spring (800ms)
                    </button>
                </div>
            </DemoCard>
        </div>
    );
};
