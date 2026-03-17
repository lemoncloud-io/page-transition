import { useParams } from 'react-router-dom';

import { Header } from '../components';

export const DetailPage = () => {
    const { id } = useParams<{ id: string }>();

    return (
        <div className="page">
            <Header title={`Detail #${id}`} />

            <div className="content">
                <div className="detail-card">
                    <h2>Item {id}</h2>
                    <p>
                        This is the detail page for item {id}. Navigate back using the
                        back button to see the reverse transition animation.
                    </p>
                    <p className="hint">
                        On iOS: Slides back from the left<br />
                        On Android: Lifts down with fade
                    </p>
                </div>
            </div>
        </div>
    );
};
