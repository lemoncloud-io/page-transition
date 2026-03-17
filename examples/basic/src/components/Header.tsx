import { useGoBack } from '@lemoncloud/react-page-transition';

import { usePlatformContext } from '../context';

interface HeaderProps {
    title: string;
    showBack?: boolean;
}

export const Header = ({ title, showBack = true }: HeaderProps) => {
    const { platform } = usePlatformContext();
    const goBack = useGoBack({ platform });

    return (
        <header className="header">
            {showBack && (
                <button onClick={goBack} className="back-button">
                    &larr; Back
                </button>
            )}
            <h1>{title}</h1>
        </header>
    );
};
