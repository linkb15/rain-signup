import {
  Box,
  Button,
  Container,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  HStack,
  Input,
  InputGroup,
  InputRightElement,
  Link,
  Progress,
  Spinner,
  Text,
  VStack
} from '@chakra-ui/react'
import { zodResolver } from '@hookform/resolvers/zod'
import axios from 'axios'
import type { GetStaticPropsContext, NextPage } from 'next'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useDebounce } from 'react-use'
import useSWR from 'swr'
import { z } from 'zod'

const scoreMap = {
  0: { key: 'very_weak', score: 20, color: 'red' },
  1: { key: 'weak', score: 40, color: 'orange' },
  2: { key: 'average', score: 60, color: 'yellow' },
  3: { key: 'strong', score: 80, color: 'cyan' },
  4: { key: 'very_strong', score: 100, color: 'green' }
}

export async function getStaticProps({ locale }: GetStaticPropsContext) {
  return {
    props: {
      ...(await serverSideTranslations(locale || 'en', ['common']))
      // Will be passed to the page component as props
    }
  }
}

const fetcher = (url: string, password: string, relatedTerms: string[]) =>
  axios
    .post(url, {
      password: password,
      related_terms: relatedTerms
    })
    .then((res) => res.data)

const Home: NextPage = () => {
  const { t } = useTranslation('common')
  const schema = useMemo(
    () =>
      z.object({
        firstName: z.number().min(10),
        middleName: z.string(),
        lastName: z.string(),
        email: z.string().email({ message: t('email_invalid') }),
        password: z.string()
      }),
    [t]
  )

  const {
    register,
    handleSubmit,
    watch,
    getValues,
    formState: { errors }
  } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema)
  })
  // const password = getValues('password')
  const password = watch('password')
  const relatedTerms = watch(['email', 'firstName', 'lastName', 'middleName'])

  const [debouncedPassword, setDebouncedPassword] = useState('')

  const [, cancel] = useDebounce(
    () => {
      if (!!password) {
        setDebouncedPassword(password)
      }
    },
    1000,
    [password, relatedTerms]
  )

  const { data, isValidating } = useSWR(
    !!debouncedPassword
      ? [
          'https://dev-gcc.rain-test.com/api/1/password/strength',
          debouncedPassword,
          relatedTerms.filter((e) => !!e)
        ]
      : null,
    fetcher,
    { revalidateOnFocus: false }
  )

  const score = data?.score as keyof typeof scoreMap
  const scoreTextKey = scoreMap[score]?.key
  const scoreProgress = scoreMap[score]?.score
  const scoreColor = scoreMap[score]?.color

  const onSubmit = handleSubmit((data) => {
    console.log(data)
  })
  return (
    <Box>
      <Container maxW='container.md' as='form' noValidate onSubmit={onSubmit} my={8}>
        <VStack align={'left'}>
          <Heading>{t('title')}</Heading>
          <Heading>{t('form_title')}</Heading>
          <Text>{t('form_description')}</Text>
          <HStack>
            <FormControl isInvalid={!!errors.firstName} isRequired>
              <FormLabel htmlFor='firstName'>{t('first_name')}</FormLabel>
              <Input id='firstName' type='firstName' {...register('firstName')} />
              <FormErrorMessage>{errors?.firstName?.message}</FormErrorMessage>
            </FormControl>

            <FormControl isInvalid={!!errors.middleName}>
              <FormLabel htmlFor='middleName'>{t('middle_name')}</FormLabel>
              <Input id='middleName' type='middleName' {...register('middleName')} />
              <FormErrorMessage>{errors?.middleName?.message}</FormErrorMessage>
            </FormControl>
          </HStack>

          <FormControl isInvalid={!!errors.lastName} isRequired>
            <FormLabel htmlFor='lastName'>{t('last_name')}</FormLabel>
            <Input id='lastName' type='lastName' {...register('lastName')} />
            <FormErrorMessage>{errors?.lastName?.message}</FormErrorMessage>
          </FormControl>

          <FormControl isInvalid={!!errors.email} isRequired>
            <FormLabel htmlFor='email'>{t('email')}</FormLabel>
            <Input id='email' type='email' {...register('email')} />
            <FormErrorMessage>{errors?.email?.message}</FormErrorMessage>
          </FormControl>

          <FormControl isInvalid={!!errors.password} isRequired>
            <FormLabel htmlFor='password'>{t('password')}</FormLabel>

            <InputGroup>
              <Input id='password' type='password' {...register('password')} />

              {isValidating && (
                <InputRightElement pointerEvents='none'>
                  <Spinner />
                </InputRightElement>
              )}
            </InputGroup>

            <FormErrorMessage>{errors?.password?.message}</FormErrorMessage>

            {scoreTextKey && (
              <>
                <Progress colorScheme={scoreColor} size='xs' value={scoreProgress} />
                <Text>{t(scoreTextKey)}</Text>
                <ul>
                  <li>{t('not_repetitive')}</li>
                  <li>{t('not_include_name')}</li>
                  <li>{t('min_required', { count: 8 })}</li>
                </ul>
              </>
            )}
          </FormControl>
          <Text>
            {t('terms_description')} <Link>{t('terms_link')}</Link>
          </Text>
          <Button type='submit'>{t('btn_create_account')}</Button>
          <Text textAlign={'center'}>
            {t('already_have_account')} <Link>{t('btn_sign_in')}</Link>
          </Text>
        </VStack>
      </Container>
    </Box>
  )
}

export default Home
