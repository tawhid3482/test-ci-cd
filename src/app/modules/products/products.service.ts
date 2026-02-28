import { PrismaClient, STATUS, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

type ProductPayload = {
  name: string;
  description: string;
  price: number;
  stock: number;
  images: string[];
  categoryId: string;
};

type ProductQuery = Record<string, unknown>;

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 100;

const sortableFields = [
  "createdAt",
  "updatedAt",
  "price",
  "name",
  "stock",
] as const;
type SortableField = (typeof sortableFields)[number];

const getQueryString = (value: unknown): string | undefined => {
  if (Array.isArray(value)) {
    const firstValue = value[0];
    return typeof firstValue === "string" ? firstValue : undefined;
  }

  return typeof value === "string" ? value : undefined;
};

const getQueryNumber = (value: unknown): number | undefined => {
  const numericValue = Number(getQueryString(value));
  return Number.isFinite(numericValue) ? numericValue : undefined;
};

const getQueryBoolean = (value: unknown): boolean | undefined => {
  const normalizedValue = getQueryString(value)?.toLowerCase();

  if (["true", "1", "yes"].includes(normalizedValue || "")) return true;
  if (["false", "0", "no"].includes(normalizedValue || "")) return false;

  return undefined;
};

const getProduct = async (query: ProductQuery) => {
  const searchTerm = getQueryString(query.searchTerm)?.trim();
  const categoryName = getQueryString(query.categoryName)?.trim();
  const minPrice = getQueryNumber(query.minPrice);
  const maxPrice = getQueryNumber(query.maxPrice);
  const inStock = getQueryBoolean(query.inStock);

  const requestedStatus = getQueryString(query.status) as STATUS | undefined;
  const status = Object.values(STATUS).includes(requestedStatus as STATUS)
    ? requestedStatus
    : STATUS.ACTIVE;

  const page = Math.max(getQueryNumber(query.page) || DEFAULT_PAGE, 1);
  const limit = Math.min(
    Math.max(getQueryNumber(query.limit) || DEFAULT_LIMIT, 1),
    MAX_LIMIT,
  );
  const skip = (page - 1) * limit;

  const sortByValue = getQueryString(query.sortBy) as SortableField | undefined;
  const sortBy: SortableField = sortableFields.includes(
    sortByValue as SortableField,
  )
    ? (sortByValue as SortableField)
    : "createdAt";

  const sortOrderInput = getQueryString(query.sortOrder)?.toLowerCase();
  const sortOrder: Prisma.SortOrder = sortOrderInput === "asc" ? "asc" : "desc";

  const where: Prisma.ProductWhereInput = {
    status,
  };

  if (categoryName) {
    where.category = {
      name: {
        contains: categoryName,
        mode: "insensitive",
      },
    };
  }

  if (typeof minPrice === "number" || typeof maxPrice === "number") {
    where.price = {
      ...(typeof minPrice === "number" ? { gte: minPrice } : {}),
      ...(typeof maxPrice === "number" ? { lte: maxPrice } : {}),
    };
  }

  if (typeof inStock === "boolean") {
    where.stock = inStock ? { gt: 0 } : { lte: 0 };
  }

  if (searchTerm) {
    where.OR = [
      {
        name: {
          contains: searchTerm,
          mode: "insensitive",
        },
      },
      {
        description: {
          contains: searchTerm,
          mode: "insensitive",
        },
      },
    ];
  }

  const [data, total] = await prisma.$transaction([
    prisma.product.findMany({
      where,
      orderBy: {
        [sortBy]: sortOrder,
      },
      skip,
      take: limit,
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        stock: true,
        images: true,
        status: true,
        categoryId: true,
        createdAt: true,
        updatedAt: true,
        category: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    }),
    prisma.product.count({ where }),
  ]);

  return {
    meta: {
      total,
      page,
      limit,
      totalPage: Math.ceil(total / limit),
    },
    data,
  };
};

const createProduct = async (payload: ProductPayload) => {
  const product = await prisma.product.create({
    data: payload,
  });

  return product;
};

const getCategoryProduct = async () => {
  const result = await prisma.categories.findMany({
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      name: true,
      image: true,
      products: {
        where: {
          status: STATUS.ACTIVE,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 8,
      },
    },
  });

  return result;
};

const getRelatedProduct = async (categoryId: string) => {
  const result = await prisma.product.findMany({
    where: {
      categoryId,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 9,
  });

  return result;
};

const getSingleProduct = async (id: string) => {
  const result = await prisma.product.findFirst({
    where: {
      id,
      status: STATUS.ACTIVE,
    },
  });
  return result;
};

const updateProduct = async (id: string, payload: Partial<ProductPayload>) => {
  const result = await prisma.product.update({
    where: {
      id,
    },
    data: payload,
  });

  return result;
};

const deleteProduct = async (id: string) => {
  const result = await prisma.product.update({
    where: {
      id,
    },
    data: {
      status: STATUS.INACTIVE,
    },
  });

  return result;
};

export const ProductService = {
  createProduct,
  getProduct,
  getCategoryProduct,
  updateProduct,
  getSingleProduct,
  deleteProduct,
  getRelatedProduct,
};
