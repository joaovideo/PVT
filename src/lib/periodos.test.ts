import { numeroDeDiarias, periodosSobrepoem } from './periodos'

describe('periodosSobrepoem', () => {
  it('detecta sobreposição parcial', () => {
    expect(
      periodosSobrepoem(
        { inicio: '2026-07-10', fim: '2026-07-13' },
        { inicio: '2026-07-12', fim: '2026-07-15' },
      ),
    ).toBe(true)
  })

  it('detecta período contido no outro', () => {
    expect(
      periodosSobrepoem(
        { inicio: '2026-07-10', fim: '2026-07-20' },
        { inicio: '2026-07-12', fim: '2026-07-14' },
      ),
    ).toBe(true)
  })

  it('períodos disjuntos não sobrepõem', () => {
    expect(
      periodosSobrepoem(
        { inicio: '2026-07-10', fim: '2026-07-13' },
        { inicio: '2026-07-20', fim: '2026-07-22' },
      ),
    ).toBe(false)
  })

  it('checkout no mesmo dia do check-in de outro NÃO sobrepõe (fim exclusivo)', () => {
    expect(
      periodosSobrepoem(
        { inicio: '2026-07-10', fim: '2026-07-13' },
        { inicio: '2026-07-13', fim: '2026-07-15' },
      ),
    ).toBe(false)
    expect(
      periodosSobrepoem(
        { inicio: '2026-07-13', fim: '2026-07-15' },
        { inicio: '2026-07-10', fim: '2026-07-13' },
      ),
    ).toBe(false)
  })
})

describe('numeroDeDiarias', () => {
  it('período de 1 diária', () => {
    expect(numeroDeDiarias({ inicio: '2026-07-10', fim: '2026-07-11' })).toBe(1)
  })

  it('período de 3 diárias', () => {
    expect(numeroDeDiarias({ inicio: '2026-07-10', fim: '2026-07-13' })).toBe(3)
  })

  it('inicio igual ao fim tem 0 diárias', () => {
    expect(numeroDeDiarias({ inicio: '2026-07-10', fim: '2026-07-10' })).toBe(0)
  })
})
