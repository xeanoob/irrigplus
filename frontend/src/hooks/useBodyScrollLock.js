import { useEffect } from 'react';

/**
 * Hook pour verrouiller le scroll de la page d'arrière-plan sur smartphone (iOS / Android)
 * Empêche tout mouvement ou swipe d'arrière-plan quand une modal est ouverte.
 */
export const useBodyScrollLock = (isLocked) => {
    useEffect(() => {
        if (!isLocked) return;

        const scrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
        
        const originalStyle = {
            position: document.body.style.position,
            top: document.body.style.top,
            left: document.body.style.left,
            right: document.body.style.right,
            width: document.body.style.width,
            overflow: document.body.style.overflow,
            touchAction: document.body.style.touchAction,
        };

        document.body.style.position = 'fixed';
        document.body.style.top = `-${scrollY}px`;
        document.body.style.left = '0';
        document.body.style.right = '0';
        document.body.style.width = '100%';
        document.body.style.overflow = 'hidden';
        document.body.style.touchAction = 'none';
        document.body.classList.add('modal-open');

        // Empêche le drag/touchmove sur l'arrière-plan et le fond gris
        const handleTouchMove = (e) => {
            if (!e.target.closest('.modal-scroll-area')) {
                if (e.cancelable) {
                    e.preventDefault();
                }
            }
        };

        document.addEventListener('touchmove', handleTouchMove, { passive: false });

        return () => {
            document.body.style.position = originalStyle.position;
            document.body.style.top = originalStyle.top;
            document.body.style.left = originalStyle.left;
            document.body.style.right = originalStyle.right;
            document.body.style.width = originalStyle.width;
            document.body.style.overflow = originalStyle.overflow;
            document.body.style.touchAction = originalStyle.touchAction;
            document.body.classList.remove('modal-open');

            document.removeEventListener('touchmove', handleTouchMove);

            // Restaure la position de scroll initiale
            window.scrollTo(0, scrollY);
        };
    }, [isLocked]);
};

export default useBodyScrollLock;
