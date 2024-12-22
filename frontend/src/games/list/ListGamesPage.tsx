'use client';

import { useApi } from '@/api/Api';
import { RequestSnackbar } from '@/api/Request';
import { useAuth, useFreeTier } from '@/auth/Auth';
import GameTable from '@/components/games/list/GameTable';
import { Link } from '@/components/navigation/Link';
import ListGamesTutorial from '@/components/tutorial/ListGamesTutorial';
import { GameInfo } from '@/database/game';
import { RequirementCategory } from '@/database/requirement';
import { useDataGridContextMenu } from '@/hooks/useDataGridContextMenu';
import { useNextSearchParams } from '@/hooks/useNextSearchParams';
import { usePagination } from '@/hooks/usePagination';
import { useRouter } from '@/hooks/useRouter';
import LoadingPage from '@/loading/LoadingPage';
import Icon from '@/style/Icon';
import UpsellAlert from '@/upsell/UpsellAlert';
import UpsellDialog, { RestrictedAction } from '@/upsell/UpsellDialog';
import UpsellPage from '@/upsell/UpsellPage';
import {
    Badge,
    Button,
    Container,
    Divider,
    Grid2,
    Stack,
    Typography,
} from '@mui/material';
import { GridPaginationModel } from '@mui/x-data-grid-pro';
import { useEffect, useState } from 'react';
import { ListItemContextMenu } from './ListItemContextMenu';
import SearchFilters from './SearchFilters';

const ListGamesPage = () => {
    const isFreeTier = useFreeTier();
    const [upsellDialogOpen, setUpsellDialogOpen] = useState(false);
    const [upsellAction, setUpsellAction] = useState('');
    const type = useNextSearchParams().searchParams.get('type') || '';
    const api = useApi();
    const [reviewQueueLabel, setReviewQueueLabel] = useState('');
    const contextMenu = useDataGridContextMenu();
    const router = useRouter();
    const { user } = useAuth();

    useEffect(() => {
        api.listGamesForReview()
            .then((resp) => {
                if (resp.data.games.length > 0) {
                    setReviewQueueLabel(
                        `${resp.data.games.length}${resp.data.lastEvaluatedKey ? '+' : ''}`,
                    );
                }
            })
            .catch((err) => {
                console.error('listGamesForReview: ', err);
            });
    }, [setReviewQueueLabel, api]);

    const pagination = usePagination(null, 0, 10);
    const { pageSize, setPageSize, request, data, onSearch } = pagination;

    const onClick = ({ cohort, id }: GameInfo) => {
        router.push(
            `/games/${cohort.replaceAll('+', '%2B')}/${id.replaceAll('?', '%3F')}`,
        );
    };

    const onPaginationModelChange = (model: GridPaginationModel) => {
        if (model.pageSize !== pageSize) {
            setPageSize(model.pageSize);
        }
    };

    const onDownloadDatabase = () => {
        setUpsellAction(RestrictedAction.DownloadDatabase);
        setUpsellDialogOpen(true);
    };

    if (!user) {
        return <LoadingPage />;
    }

    if (isFreeTier && type === 'player') {
        return (
            <UpsellPage
                redirectTo='/games'
                currentAction={RestrictedAction.SearchDatabase}
            />
        );
    }
    if (isFreeTier && type === 'position') {
        return (
            <UpsellPage
                redirectTo='/games'
                currentAction={RestrictedAction.DatabaseExplorer}
            />
        );
    }

    return (
        <Container maxWidth='xl' sx={{ py: 5 }}>
            <RequestSnackbar request={request} />

            {isFreeTier && (
                <>
                    <Stack alignItems='center' mb={5}>
                        <UpsellAlert>
                            To avoid unfair preparation against Dojo members, free-tier
                            users have limited access to the Dojo Database. Upgrade your
                            account to view the full Database.
                        </UpsellAlert>
                    </Stack>
                    <UpsellDialog
                        open={upsellDialogOpen}
                        onClose={setUpsellDialogOpen}
                        currentAction={upsellAction}
                    />
                </>
            )}

            <Grid2 container spacing={5} wrap='wrap-reverse'>
                <Grid2 size={{ xs: 12, md: 8, lg: 8 }}>
                    <GameTable
                        namespace='games-list-page'
                        limitFreeTier
                        pagination={pagination}
                        onRowClick={(params) => onClick(params.row)}
                        onPaginationModelChange={onPaginationModelChange}
                        contextMenu={contextMenu}
                        defaultVisibility={{
                            moves: false,
                        }}
                    />
                    <ListItemContextMenu
                        game={
                            contextMenu.rowIds
                                ? data.find((g) => g.id === contextMenu.rowIds[0])
                                : undefined
                        }
                        onClose={contextMenu.close}
                        position={contextMenu.position}
                    />
                </Grid2>

                <Grid2 size={{ xs: 12, md: 4, lg: 4 }}>
                    <Stack spacing={4}>
                        <Button
                            data-cy='import-game-button'
                            id='import-game-button'
                            variant='contained'
                            component={Link}
                            href='/games/import'
                            color='success'
                            startIcon={
                                <Icon
                                    name={RequirementCategory.Games}
                                    color='inherit'
                                    sx={{ marginRight: '0.3rem' }}
                                />
                            }
                        >
                            Analyze a Game
                        </Button>

                        <Divider />

                        <SearchFilters
                            isLoading={request.isLoading()}
                            onSearch={onSearch}
                        />

                        <Stack spacing={0.5}>
                            <Stack direction='row' spacing={1}>
                                <Typography variant='body2' alignSelf='start'>
                                    <Link href='/games/review-queue'>
                                        <Icon
                                            name='line'
                                            color='primary'
                                            sx={{
                                                marginRight: '0.5rem',
                                                verticalAlign: 'middle',
                                            }}
                                        />
                                        Sensei Game Review Queue
                                    </Link>
                                </Typography>

                                {reviewQueueLabel && (
                                    <Badge
                                        badgeContent={reviewQueueLabel}
                                        color='secondary'
                                        sx={{
                                            '& .MuiBadge-badge': {
                                                transform: 'none',
                                                position: 'relative',
                                            },
                                        }}
                                    ></Badge>
                                )}
                            </Stack>

                            <Typography
                                data-cy='download-database-button'
                                id='download-full-database'
                                variant='body2'
                                alignSelf='start'
                            >
                                <Link
                                    href={
                                        isFreeTier
                                            ? undefined
                                            : 'https://chess-dojo-prod-game-database.s3.amazonaws.com/dojo_database.zip'
                                    }
                                    target='_blank'
                                    rel='noreferrer'
                                    onClick={isFreeTier ? onDownloadDatabase : undefined}
                                >
                                    <Icon
                                        name='download'
                                        color='primary'
                                        sx={{
                                            marginRight: '0.5rem',
                                            verticalAlign: 'middle',
                                        }}
                                    />
                                    Download full database (updated daily)
                                </Link>
                            </Typography>
                        </Stack>
                    </Stack>
                </Grid2>
            </Grid2>

            <ListGamesTutorial />
        </Container>
    );
};

export default ListGamesPage;
