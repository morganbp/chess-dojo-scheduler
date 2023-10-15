import { Button, Stack, Typography } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { LoadingButton } from '@mui/lab';

import { Request } from '../../api/Request';

interface LoadMoreButtonProps {
    request: Request;
    since?: string;
    startKey?: string;
    onLoadMore: () => void;
}

const LoadMoreButton: React.FC<LoadMoreButtonProps> = ({
    request,
    since,
    startKey,
    onLoadMore,
}) => {
    if (startKey) {
        return (
            <Stack alignItems='center' spacing={1}>
                <LoadingButton
                    variant='contained'
                    loading={request.isLoading()}
                    onClick={onLoadMore}
                >
                    Load More
                </LoadingButton>
            </Stack>
        );
    }

    if (since) {
        const date = new Date(since);
        return (
            <Stack alignItems='center' spacing={1}>
                <CheckCircleOutlineIcon color='success' fontSize='large' />

                <Stack alignItems='center'>
                    <Typography fontWeight='bold'>You're all caught up</Typography>
                    <Typography color='text.secondary'>
                        You've seen all new posts since {date.toLocaleDateString()}
                    </Typography>

                    <Button onClick={onLoadMore} sx={{ textTransform: 'none' }}>
                        View older posts
                    </Button>
                </Stack>
            </Stack>
        );
    }

    return (
        <Stack alignItems='center' spacing={1}>
            <CheckCircleOutlineIcon color='success' fontSize='large' />

            <Stack alignItems='center'>
                <Typography fontWeight='bold'>No More Posts</Typography>
                <Typography color='text.secondary'>
                    You've seen all posts in your newsfeed
                </Typography>
            </Stack>
        </Stack>
    );
};

export default LoadMoreButton;