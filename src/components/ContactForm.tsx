'use client'
import Link from 'next/link'
import { useRef, useState } from 'react'

const SUBJECTS: [string, string][] = [
  ['pauta', 'Sugestão de pauta'],
  ['divulgacao', 'Divulgação ou cópia para análise'],
  ['parceria', 'Parceria'],
  ['correcao', 'Correção de erro'],
  ['privacidade', 'Privacidade'],
  ['outro', 'Outro'],
]

export function ContactForm() {
  const [state, setState] = useState<'idle' | 'sending' | 'ok' | 'error'>('idle')
  const [msg, setMsg] = useState('')
  const started = useRef(Date.now())

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget // guardado antes do await, pois o React zera o currentTarget depois
    const f = new FormData(form)
    setState('sending')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...Object.fromEntries(f), consent: f.get('consent') === 'on', elapsed: Date.now() - started.current }),
      })
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string }
      if (res.ok && data.ok) {
        setState('ok')
        form.reset()
      } else {
        setMsg(data.error || 'Não foi possível enviar. Tente novamente em alguns minutos.')
        setState('error')
      }
    } catch {
      setMsg('Sem conexão. Verifique a internet e tente de novo.')
      setState('error')
    }
  }

  if (state === 'ok')
    return (
      <div className="note-box" role="status">
        <b>Mensagem enviada.</b> Obrigado! Responderemos pelo e-mail que você informou.
      </div>
    )

  return (
    <form className="cform" onSubmit={onSubmit} noValidate={false}>
      <div className="cf-row">
        <label>
          Nome *
          <input name="name" required maxLength={120} autoComplete="name" />
        </label>
        <label>
          E-mail *
          <input name="email" type="email" required maxLength={160} autoComplete="email" />
        </label>
      </div>
      <div className="cf-row">
        <label>
          Assunto *
          <select name="subject" required defaultValue="">
            <option value="" disabled>Escolha uma opção</option>
            {SUBJECTS.map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </label>
        <label>
          Site ou canal (opcional)
          <input name="site" maxLength={200} placeholder="https://" />
        </label>
      </div>
      <label>
        Mensagem *
        <textarea name="body" required rows={7} minLength={10} maxLength={4000} />
      </label>
      {/* campo-isca contra robôs: pessoas não veem nem preenchem */}
      <label className="hp" aria-hidden="true">
        Não preencha
        <input name="company" tabIndex={-1} autoComplete="off" />
      </label>
      <label className="cf-check">
        <input name="consent" type="checkbox" required />
        <span>
          Li e concordo com a <Link href="/politica-de-privacidade">política de privacidade</Link>.
        </span>
      </label>
      {state === 'error' ? <p className="cf-error" role="alert">{msg}</p> : null}
      <button className="btn" type="submit" disabled={state === 'sending'}>
        {state === 'sending' ? 'Enviando…' : 'Enviar mensagem'}
      </button>
    </form>
  )
}
