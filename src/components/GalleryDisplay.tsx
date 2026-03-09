import { Masonry } from "@/components/reactbits";
import { useEffect, useState } from "react";
import { format } from "date-fns";

export interface GalleryMediaItem {
    id: string;
    media_url: string;
    mimetype: string;
    alt?: string;
    created_at?: string;
    community_name?: string;
}

interface GalleryDisplayProps {
    media: GalleryMediaItem[];
    emptyMessage?: string;
    title?: string;
    subtitle?: string;
}

export const GalleryDisplay = ({ media, emptyMessage = "No media available for this space.", title, subtitle }: GalleryDisplayProps) => {
    const [columns, setColumns] = useState(3);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 768) {
                setColumns(1);
            } else if (window.innerWidth < 1024) {
                setColumns(2);
            } else {
                setColumns(3);
            }
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    if (!media || media.length === 0) {
        return (
            <div className="w-full">
                {(title || subtitle) && (
                    <div className="text-center mb-8">
                        {title && <h2 className="text-3xl sm:text-4xl font-bold text-foreground uppercase">{title}</h2>}
                        {subtitle && <p className="text-muted-foreground max-w-2xl mx-auto mt-2">{subtitle}</p>}
                    </div>
                )}
                <div className="py-12 text-center border-2 border-foreground shadow-brutal bg-background text-foreground">
                    <p className="text-lg font-medium">{emptyMessage}</p>
                </div>
            </div>
        );
    }

    const masonryItems = media.map((item, index) => {
        const isVideo = item.mimetype?.startsWith('video/');
        return {
            id: item.id,
            src: item.media_url,
            alt: item.alt || `Gallery item ${index + 1}`,
            type: isVideo ? 'video' as const : 'image' as const,
            date: item.created_at ? format(new Date(item.created_at), 'MMM d, yyyy') : undefined,
            communityName: item.community_name,
        };
    });

    return (
        <div className="w-full max-w-7xl mx-auto">
            {(title || subtitle) && (
                <div className="text-center mb-8 md:mb-12">
                    {title && <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground uppercase">{title}</h2>}
                    {subtitle && <p className="text-base sm:text-lg text-muted-foreground max-w-4xl mx-auto mt-4 leading-relaxed">{subtitle}</p>}
                </div>
            )}
            <Masonry items={masonryItems} columns={columns} gap={16} />
        </div>
    );
};
