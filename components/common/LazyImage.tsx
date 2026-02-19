import React, { useState, useEffect } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface LazyImageProps extends HTMLMotionProps<"img"> {
    src: string;
    alt: string;
    placeholderSrc?: string;
    useSkeleton?: boolean;
    className?: string;
}

const LazyImage: React.FC<LazyImageProps> = ({
    src,
    alt,
    className,
    placeholderSrc = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxIDEiPjwvc3ZnPg==', // transparent pixel
    useSkeleton = false,
    ...props
}) => {
    const [imageSrc, setImageSrc] = useState(placeholderSrc);
    const [imageRef, setImageRef] = useState<HTMLImageElement | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        let observer: IntersectionObserver;
        let didCancel = false;

        if (imageRef && imageSrc === placeholderSrc) {
            if (IntersectionObserver) {
                observer = new IntersectionObserver(
                    entries => {
                        entries.forEach(entry => {
                            if (
                                !didCancel &&
                                (entry.intersectionRatio > 0 || entry.isIntersecting)
                            ) {
                                setImageSrc(src);
                                observer.unobserve(imageRef);
                            }
                        });
                    },
                    {
                        threshold: 0.01,
                        rootMargin: '75%'
                    }
                );
                observer.observe(imageRef);
            } else {
                // Fallback for older browsers
                setImageSrc(src);
            }
        }

        return () => {
            didCancel = true;
            if (observer && imageRef) {
                observer.unobserve(imageRef);
            }
        };
    }, [src, imageSrc, imageRef, placeholderSrc]);

    const onLoad = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
        setIsLoaded(true);
        if (props.onLoad) {
            props.onLoad(e as any);
        }
    };

    return (
        <div className={`relative overflow-hidden ${className || ''}`} style={{ minWidth: '1px', minHeight: '1px' }}>
            {useSkeleton && !isLoaded && (
                <div className="absolute inset-0 bg-slate-200 animate-pulse rounded-md" />
            )}
            <motion.img
                ref={setImageRef}
                src={imageSrc}
                alt={alt}
                onLoad={onLoad}
                className={`w-full h-full object-cover transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'} ${className || ''}`}
                {...props}
            />
        </div>
    );
};

export default LazyImage;
