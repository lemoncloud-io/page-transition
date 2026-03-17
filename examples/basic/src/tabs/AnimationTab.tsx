import { useNavigateWithTransition } from '@lemoncloud/react-page-transition';

import { usePlatformContext } from '../context';

const ANIMATIONS = [
    {
        type: 'fade' as const,
        icon: '✨',
        title: 'Fade',
        desc: 'Crossfade transition',
        use: 'Modals, auth flows',
    },
    {
        type: 'zoom' as const,
        icon: '🔍',
        title: 'Zoom',
        desc: 'Scale + fade',
        use: 'Galleries, detail views',
    },
    {
        type: 'slide' as const,
        icon: '➡️',
        title: 'Slide',
        desc: 'Horizontal slide',
        use: 'iOS-style navigation',
    },
    {
        type: 'lift' as const,
        icon: '⬆️',
        title: 'Lift',
        desc: 'Vertical lift',
        use: 'Android-style navigation',
    },
    {
        type: 'none' as const,
        icon: '⚡',
        title: 'None',
        desc: 'Instant switch',
        use: 'Deep links, resets',
    },
];

export const AnimationTab = () => {
    const { platform } = usePlatformContext();
    const navigate = useNavigateWithTransition({ platform });

    return (
        <div className="tab-content">
            <div className="tab-header">
                <h2>Animation Types</h2>
                <p>Override platform default with explicit animation type</p>
            </div>

            <div className="animation-grid">
                {ANIMATIONS.map((anim) => (
                    <button
                        key={anim.type}
                        className="animation-card"
                        onClick={() => navigate(`/detail/${anim.type}`, { animation: anim.type })}
                    >
                        <span className="animation-icon">{anim.icon}</span>
                        <span className="animation-title">{anim.title}</span>
                        <span className="animation-desc">{anim.desc}</span>
                        <span className="animation-use">{anim.use}</span>
                    </button>
                ))}
            </div>

            <div className="code-example">
                <pre>{`// Override platform animation
navigate('/modal', { animation: 'fade' });
navigate('/gallery', { animation: 'zoom' });
navigate('/reset', { animation: 'none' });`}</pre>
            </div>
        </div>
    );
};
