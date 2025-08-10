
'use client'
import React, { useEffect, useState } from 'react'
import { Box, Text, } from '@chakra-ui/react'
import Image from 'next/image'
import { ButtonWrap, MainPage, AgentItem, AgentItemLoading, CategoryButtonLoading } from '@/components/'
import { SearchImg } from '@/assets/images'
import { getAgentListApi} from '@/api'
import { useAccount } from 'wagmi'
import { enrichAgentCategoriesWithMcpNames } from '@/utils'

export const AgentList = ({ type }) => {
  const [activeCategory, setActiveCategory] = useState('View All')

  const [rawMcpList, setRawMcpList] = useState([])
  const [mcpList, setMcpList] = useState([])
  const [categories, setCategories] = useState([])
  const { address,  } = useAccount()
  const [searchKeyword, setSearchKeyword] = useState('')
  const [isLoading, setLoading] = useState(false)
  const [pageIndex, setPageIndex] = useState(0)

  const pageSize = 100

   useEffect(() => {
    getAgentList()
  }, [address])

  



  const getAgentList = async () => {
    setLoading(true)
    const res = await getAgentListApi({
        queryType: type,
        limit: pageSize,
        offset: pageIndex
    })
    setLoading(false)
    
    if(res) {
      const { agents, categories } = res
      
      const enrichedAgents = enrichAgentCategoriesWithMcpNames(agents)
      setRawMcpList(enrichedAgents)
      setCategories(categories)
      setMcpList(enrichedAgents)

    }
  }



  const filterByCategory = (list) => {
    if (activeCategory === 'View All') return list
    return list.filter(mcp => mcp.categories.includes(activeCategory))
  }


  const filterBySearch = (list) => {
    if (!searchKeyword.trim()) return list
    const keyword = searchKeyword.trim().toLowerCase()
    return list.filter(mcp =>
      mcp.name.toLowerCase().includes(keyword) ||
      mcp.description.toLowerCase().includes(keyword)
    )
  } 

  const filteredList = filterBySearch(filterByCategory(mcpList))



  return (
    <MainPage>
      <Box className='fx-col w-full' overflowY="scroll" h='100%' pb='32px'>
          <Box
            className="
              flex flex-col md:flex-row md:justify-between md:items-center
              gap-4 mt-[32px]
            "
          >
            {/* 搜索框，在小屏时在上方 */}
            <Box className="order-1 md:order-none w-full md:w-[314px] h-[40px] bg-[#1F1F22] rounded-[8px] flex items-center gap-2 px-4 py-3">
              <Image src={SearchImg} height={16} width={16} alt="search" />
              
              <input
                type="text"
                placeholder="Search"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="bg-transparent border-none outline-none text-[12px] text-[#E0E0E0] placeholder:text-[#878787] w-full"
              />
            </Box>

           
          </Box>

         
         {
            !isLoading ? 
            <Box className='mt-[46px] flex flex-wrap gap-4 '>
            
                <ButtonWrap>
                  <CategoryButton
                    label='View All'
                    count={rawMcpList.length}
                    isActive={activeCategory === 'View All'}
                    onClick={() => setActiveCategory('View All')}
                  />
                </ButtonWrap> 
              
              {
                categories.map(item => (
                  <ButtonWrap key={item.name}>
                    <CategoryButton

                        label={item.name}
                        count={item.count}
                        isActive={activeCategory === item.name}
                        onClick={() => setActiveCategory(item.name)}
                    />
                  </ButtonWrap>
                ))
              }
            </Box> :
            <Box className='mt-[46px] flex flex-wrap gap-4 '>
              {
                Array.from({length: 4}).map((item,idx) => (
                  <CategoryButtonLoading key={`item${idx}`}/>
                ))
              }
            </Box>
          }

        <Box mt='46px'>
          <Box className="              
             flex flex-col items-center
              md:grid md:grid-cols-2
              lg:grid-cols-3
              xl:grid-cols-4
              gap-4
          ">
            {
              !isLoading ? 
              filteredList.map(mcpItem => (
                <AgentItem
                  key={mcpItem.id}
                  {...mcpItem}
                />
              )) :
               Array.from({length: 16}).map((item,idx) => (
                <AgentItemLoading key={`item${idx}`}/>
              ))
            }
          </Box>
        </Box>
      </Box>
    </MainPage>
  )
}

const CategoryButton = ({ label, count, isActive, onClick }) => {
  return (
    <Box
      onClick={onClick}
      className="cursor-pointer center rounded-[8px]"
      fontSize={{ base: '12px', md: '14px' }}
      fontWeight={600}
      border={isActive ? '1px solid #E0E0E0' : '1px solid #293033'}
      color={isActive ? '#010101' : '#E0E0E0'}
      bgColor={isActive ? '#E0E0E0' : '#1F1F22'}
      px={{ base: '12px', md: '16px', lg: '24px' }}
      py={{ base: '6px', md: '8px', lg: '12px' }}
      minW="fit-content"
      whiteSpace="nowrap"
      transition="all 0.2s"
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      {count !== undefined ? `${label} (${count})` : label}
    </Box>
  )
}

