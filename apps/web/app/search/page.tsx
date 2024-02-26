import { PlatformProduct } from "@enterprise-commerce/core/platform/types"
import { meilisearch } from "clients/meilisearch"
import { unstable_cache } from "next/cache"
import { createSearchParamsCache, parseAsArrayOf, parseAsInteger, parseAsString } from "nuqs/server"
import { Suspense } from "react"

import { composeFilters } from "views/Search/composeFilters"
import { FacetsDesktop } from "views/Search/FacetsDesktop"
import { FacetsMobile } from "views/Search/FacetsMobile"
import { HitsSection } from "views/Search/HitsSection"
import { PageSkeleton } from "views/Search/PageSkeleton"
import { PaginationSection } from "views/Search/PaginationSection"
import { Sorter } from "views/Search/Sorter"

export const runtime = "edge"

const searchParamsCache = createSearchParamsCache({
  q: parseAsString.withDefault(""),
  page: parseAsInteger.withDefault(1),
  minPrice: parseAsInteger,
  maxPrice: parseAsInteger,
  sortBy: parseAsString.withDefault(""),
  categories: parseAsArrayOf(parseAsString).withDefault([]),
  vendors: parseAsArrayOf(parseAsString).withDefault([]),
  tags: parseAsArrayOf(parseAsString).withDefault([]),
  colors: parseAsArrayOf(parseAsString).withDefault([]),
  sizes: parseAsArrayOf(parseAsString).withDefault([]),
})

interface SearchPageProps {
  searchParams: Record<string, string | string[] | undefined>
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <SearchView searchParams={searchParams} />
    </Suspense>
  )
}

async function SearchView({ searchParams }: SearchPageProps) {
  const { q, sortBy, page, ...rest } = searchParamsCache.parse(searchParams)

  const { totalHits, facetDistribution, hits, totalPages } = await searchProducts(q, sortBy, page, composeFilters(rest).build())
  // const availableForSale = meilisearchResults.facetDistribution?.["variants.availableForSale"]

  return (
    <div className="max-w-container-md mx-auto flex min-h-screen w-full flex-col gap-12 px-4 py-12 md:flex-row md:gap-24 md:py-24 xl:px-0 ">
      <FacetsDesktop className="hidden min-w-[250px] max-w-[250px] md:mt-16 md:block" facetDistribution={facetDistribution} />
      <div className="flex w-full flex-col">
        <div className="mb-6 flex w-full flex-wrap items-center justify-between">
          <div className="flex w-full flex-col gap-2 pb-8">
            <h1 className="text-[32px] font-semibold text-black">
              Products <span className="text-[21px] font-normal text-slate-700/70">(All {totalHits})</span>
            </h1>
            <FacetsMobile className="block md:hidden" />
            <Sorter className="ml-auto" />
          </div>

          <HitsSection hits={hits} />
          <PaginationSection queryParams={searchParams} totalPages={totalPages} />
        </div>
      </div>
    </div>
  )
}

const searchProducts = unstable_cache(
  async (query: string, sortBy: string, page: number, filter: string) => {
    const index = await meilisearch?.getIndex<PlatformProduct>("products")

    const results = await index?.search(query, {
      sort: sortBy ? [sortBy] : undefined,
      hitsPerPage: 24,
      facets: ["collections.title", "tags", "vendor", "variants.availableForSale", "flatOptions.Size", "flatOptions.Color", "minPrice"],
      filter,
      page,
    })

    const hits = results?.hits || []
    const totalPages = results?.totalPages || 0
    const facetDistribution = results?.facetDistribution || {}
    const totalHits = results.totalHits

    return { hits, totalPages, facetDistribution, totalHits }
  },
  ["products-search"],
  { revalidate: 3600 }
)
