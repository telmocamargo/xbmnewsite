import React from 'react'

const URL_RE = /(https?:\/\/[^\s<>"')]+[^\s<>"').,;:!?])/g
const shorten = (u: string) => (u.length > 60 ? u.replace(/^https?:\/\/(www\.)?/, '').slice(0, 56) + '…' : u.replace(/^https?:\/\/(www\.)?/, ''))

/** Mostra um texto simples com parágrafos e links clicáveis (o React escapa todo o resto). */
export function Linkify({ text }: { text: string }) {
  const paras = text.replace(/\r/g, '').trim().split(/\n{2,}/)
  return (
    <>
      {paras.map((p, i) => (
        <p key={i}>
          {p.split('\n').map((line, j) => (
            <React.Fragment key={j}>
              {j > 0 ? <br /> : null}
              {line.split(URL_RE).map((part, k) =>
                k % 2 === 1 ? (
                  <a key={k} href={part} rel="nofollow noopener" target="_blank">
                    {shorten(part)}
                  </a>
                ) : (
                  part
                ),
              )}
            </React.Fragment>
          ))}
        </p>
      ))}
    </>
  )
}
