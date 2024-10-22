"use client"

import { Button } from "components/ui/button"
import { useModalStore } from "stores/modal-store"
import { useQueryState } from "nuqs"

type ReviewButtonProps = {
  productId: string
}

export const ReviewButton = ({ productId }: ReviewButtonProps) => {
  const open = useModalStore((s) => s.openModal)
  const [_, setPid] = useQueryState("pid")

  return (
    <Button
      variant={"outline"}
      className="bg-white transition-all hover:scale-105"
      onClick={() => {
        setPid(productId)
        open("review")
      }}
    >
      Leave a Review
    </Button>
  )
}
