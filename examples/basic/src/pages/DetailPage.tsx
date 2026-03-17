import { useParams } from 'react-router-dom';
import { useGoBack } from '@lemoncloud/react-page-transition';

import { usePlatformContext } from '../context';

export const DetailPage = () => {
    const { id } = useParams<{ id: string }>();
    const { platform } = usePlatformContext();
    const goBack = useGoBack({ platform });

    return (
        <div className="detail-page">
            <header className="detail-header">
                <button onClick={goBack} className="back-btn">
                    ← Back
                </button>
                <h1>Detail: {id}</h1>
            </header>

            <main className="detail-content">
                <div className="detail-card">
                    <p>
                        You navigated here with: <code>{id}</code>
                    </p>
                    <p className="detail-hint">
                        Press back button to see reverse transition
                    </p>
                </div>
            </main>
        </div>
    );
};
