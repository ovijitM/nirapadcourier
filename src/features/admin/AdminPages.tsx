import { useState } from 'react'
import { Button, Field, PageTitle, Panel, TextInput } from '../../components/ui.tsx'
import { formatTaka, takaToPoisha } from '../../lib/money.ts'
import { canAct } from '../../lib/status.ts'
import { useDemo } from '../../mock/store.ts'

export function PricingPage() {
  const rate = useDemo((state) => state.rate)
  const user = useDemo((state) => state.users.find((item) => item.id === state.sessionUserId))
  const updateRate = useDemo((state) => state.updateRate)
  const [percent, setPercent] = useState(String(rate.deliveryPercent || 1))
  const [damage, setDamage] = useState(String((rate.damageControl || 100) / 100))
  const editable = user ? canAct(user.role, 'rateWrite') : false
  return (
    <div>
      <PageTitle title="Delivery pricing" />
      <Panel className="max-w-xl p-4 text-sm">
        <p>Delivery charge is {rate.deliveryPercent || 1}% of the product price.</p>
        <p className="mt-2">Damage control is {formatTaka(rate.damageControl || 100)} on every parcel. This is the insurance cover.</p>
        <p className="mt-2 text-[#5C6570]">A ৳ 1,200 product is ৳ 12 delivery plus ৳ 1 damage control. The merchant is paid COD minus those charges.</p>
      </Panel>
      {editable && (
        <div className="mt-4 flex max-w-xl gap-3">
          <Field label="Delivery percent"><TextInput value={percent} onChange={(event) => setPercent(event.target.value)} /></Field>
          <Field label="Damage control (taka)"><TextInput value={damage} onChange={(event) => setDamage(event.target.value)} /></Field>
          <Button className="mt-6" onClick={() => updateRate({ ...rate, deliveryPercent: Number(percent) || 1, damageControl: takaToPoisha(Number(damage) || 1) })}>Save</Button>
        </div>
      )}
    </div>
  )
}

export function SettingsPage() {
  const settings = useDemo((state) => state.settings)
  const updateSettings = useDemo((state) => state.updateSettings)
  const user = useDemo((state) => state.users.find((item) => item.id === state.sessionUserId))
  const [name, setName] = useState(settings.name)
  const [phone, setPhone] = useState(settings.phone)
  const [labelFooter, setLabelFooter] = useState(settings.labelFooter)
  return (
    <div className="max-w-lg space-y-3">
      <PageTitle title="Company" />
      <Field label="Name"><TextInput value={name} onChange={(event) => setName(event.target.value)} /></Field>
      <Field label="Support phone"><TextInput value={phone} onChange={(event) => setPhone(event.target.value)} /></Field>
      <Field label="Label footer"><TextInput value={labelFooter} onChange={(event) => setLabelFooter(event.target.value)} /></Field>
      {user && canAct(user.role, 'settingsWrite') && <Button onClick={() => updateSettings({ name, phone, labelFooter })}>Save</Button>}
    </div>
  )
}
