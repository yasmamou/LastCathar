import { UnlockScroll } from './UnlockScroll'

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <UnlockScroll />
      {children}
    </>
  )
}
