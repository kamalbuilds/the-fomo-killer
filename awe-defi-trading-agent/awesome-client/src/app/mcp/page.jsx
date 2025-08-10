'use client'

import React, { useEffect, useState } from 'react'
import { Box, Text, } from '@chakra-ui/react'
import Image from 'next/image'
import { ButtonWrap, MainPage, MCPItem, MCPItemLoading, CategoryButtonLoading } from '@/components/'
import { AWEBannerImg, SearchImg } from '@/assets/images'
import { getAllMcpApi, getMcpCategoriesApi } from '@/api'
import { useAccount } from 'wagmi'


export default function MarketplacePage() {
  const [activeCategory, setActiveCategory] = useState('View All')
  const [needAuth, setNeedAuth] = useState(0)
  const [rawMcpList, setRawMcpList] = useState([])
  const [mcpList, setMcpList] = useState([])
  const [categories, setCategories] = useState([])
  const { address, isConnected } = useAccount()
  const [searchKeyword, setSearchKeyword] = useState('')

  const [loading, setLoading] = useState(false)

   useEffect(() => {
      getMCPList()
  }, [address])



  const getMCPList = async () => {
    setLoading(true)
    const allMcps = await getAllMcpApi();
    const categoriesRes = await getMcpCategoriesApi();
    
    setCategories(categoriesRes)
    setRawMcpList(allMcps)
    setMcpList(allMcps)
    setLoading(false)
  }

  const filterByAuth = (list) => {
  return list.filter(mcp => {
    if (needAuth === 1) return mcp.authRequired === false
    if (needAuth === 2) return mcp.authRequired === true
    if (needAuth === 3) return mcp.authRequired === true && mcp.authVerified === true
    return true
  })
}


  const filterByCategory = (list) => {
    if (activeCategory === 'View All') return list
    return list.filter(mcp => mcp.category === activeCategory)
  }

  const filterBySearch = (list) => {
    if (!searchKeyword.trim()) return list
    const keyword = searchKeyword.trim().toLowerCase()
    return list.filter(mcp =>
      mcp.name.toLowerCase().includes(keyword) ||
      mcp.description.toLowerCase().includes(keyword)
    )
  }

  const filteredList = filterBySearch(filterByCategory(filterByAuth(mcpList)))

  const filteredCategoryMap = {}
  filteredList.forEach(mcp => {
    if (!filteredCategoryMap[mcp.category]) {
      filteredCategoryMap[mcp.category] = 1
    } else {
      filteredCategoryMap[mcp.category] += 1
    }
  })
  let all = 0
  Object.values(filteredCategoryMap).map(item => all =  all + item)
  return (
    <MainPage>
      <Box className='fx-col' overflowY="scroll" h='100%' w='100%' pb='32px' >
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

            {/* 按钮组，在小屏时在下方 */}
            <Box className="flex gap-6 order-2 md:order-none">
              <ButtonWrap>
                <CategoryButton
                  label="Auth Required"
                  isActive={needAuth === 2}
                  onClick={needAuth === 2 ? () => setNeedAuth(0) : () => setNeedAuth(2)}
                />
              </ButtonWrap>
              <ButtonWrap>
                <CategoryButton
                  label="No Auth Required"
                  isActive={needAuth === 1}
                  onClick={needAuth === 1 ? () => setNeedAuth(0) : () => setNeedAuth(1)}
                />
              </ButtonWrap>
              <ButtonWrap>
                <CategoryButton
                  label="Auth Saved"
                  isActive={needAuth === 3}
                  onClick={needAuth === 3 ? () => setNeedAuth(0) : () => setNeedAuth(3)}
                />
              </ButtonWrap>
            </Box>
          </Box>

        {
          !loading ?
          <Box className='mt-[46px] flex flex-wrap gap-4 '>
            <ButtonWrap>
              <CategoryButton
                label='View All'
                count={all}
                isActive={activeCategory === 'View All'}
                onClick={() => setActiveCategory('View All')}
              />
            </ButtonWrap>
            {
              Object.entries(filteredCategoryMap).map(([categoryName, count]) => (
                <ButtonWrap key={categoryName}>
                  <CategoryButton
                    label={categoryName}
                    count={count}
                    isActive={activeCategory === categoryName}
                    onClick={() => setActiveCategory(categoryName)}
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
              loading ? 
               Array.from({length: 16}).map((item,idx) => (
                  <MCPItemLoading key={`item${idx}`}/>
              )) : 
              filteredList.map(mcpItem => (
                <MCPItem
                  key={mcpItem.name}
                  {...mcpItem}
                />
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
