import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Loader2 } from 'lucide-react'
import type { AccountResponse, AccountUpdate } from '../api/types'
import { accountsApi } from '../api/client'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useIsMobile } from '@/hooks/use-mobile'

interface PreferredAuthModalProps {
    account: AccountResponse
    onClose: () => void
}

export function PreferredAuthModal({ account, onClose }: PreferredAuthModalProps) {
    const { t } = useTranslation()
    const [preferredAuth, setPreferredAuth] = useState<'auto' | 'oauth' | 'web'>(account.preferred_auth || 'auto')
    const [loading, setLoading] = useState(false)
    const isMobile = useIsMobile()

    const handleSubmit = async () => {
        if (preferredAuth === account.preferred_auth) {
            onClose()
            return
        }

        setLoading(true)
        try {
            const updateData: AccountUpdate = { preferred_auth: preferredAuth }
            await accountsApi.update(account.organization_uuid, updateData)
            onClose()
        } finally {
            setLoading(false)
        }
    }

    const formContent = (
        <div className='grid gap-4 py-4'>
            <div className='space-y-2'>
                <Label htmlFor='preferredAuth'>{t('accountModal.preferredAuth')}</Label>
                <Select value={preferredAuth} onValueChange={value => setPreferredAuth(value as any)}>
                    <SelectTrigger className='w-full' id='preferredAuth'>
                        <SelectValue placeholder={t('accountModal.selectPreferredAuth')} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value='auto'>{t('accountModal.authAuto')}</SelectItem>
                        <SelectItem value='oauth'>{t('accountModal.authOAuthOnly')}</SelectItem>
                        <SelectItem value='web'>{t('accountModal.authWebOnly')}</SelectItem>
                    </SelectContent>
                </Select>
                <p className='text-xs text-muted-foreground'>
                    {t('accountModal.preferredAuthDesc')}
                </p>
            </div>
        </div>
    )

    const footerContent = (
        <>
            <Button type='button' variant='outline' onClick={onClose}>
                {t('common.cancel')}
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
                {loading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                {loading ? t('common.saving') : t('common.save')}
            </Button>
        </>
    )

    if (isMobile === undefined) {
        return null
    }

    if (!isMobile) {
        return (
            <Dialog open={true} onOpenChange={onClose}>
                <DialogContent className='sm:max-w-[450px]'>
                    <DialogHeader>
                        <DialogTitle>{t('accountModal.preferredAuth')}</DialogTitle>
                        <DialogDescription>
                            {account.organization_uuid}
                        </DialogDescription>
                    </DialogHeader>
                    {formContent}
                    <DialogFooter>{footerContent}</DialogFooter>
                </DialogContent>
            </Dialog>
        )
    }

    return (
        <Drawer open={true} onOpenChange={onClose}>
            <DrawerContent>
                <div className='max-h-[90vh] overflow-auto'>
                    <DrawerHeader>
                        <DrawerTitle>{t('accountModal.preferredAuth')}</DrawerTitle>
                        <DrawerDescription>
                            {account.organization_uuid}
                        </DrawerDescription>
                    </DrawerHeader>
                    <div className='px-4'>{formContent}</div>
                    <DrawerFooter className='flex-row justify-end space-x-2'>{footerContent}</DrawerFooter>
                </div>
            </DrawerContent>
        </Drawer>
    )
}
