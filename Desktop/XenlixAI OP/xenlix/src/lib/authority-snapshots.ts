'use server';

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AuthoritySnapshotData {
  domain: string;
  oprDecimal: number;
  oprInteger: number;
  globalRank?: number | null;
  source?: string;
}

export async function saveAuthoritySnapshot(data: AuthoritySnapshotData) {
  try {
    const snapshot = await prisma.authoritySnapshot.create({
      data: {
        domain: data.domain,
        oprDecimal: data.oprDecimal,
        oprInteger: data.oprInteger,
        globalRank: data.globalRank || null,
        source: data.source || 'openpagerank',
      },
    });

    console.log(`Authority snapshot saved for ${data.domain}: ${data.oprDecimal}`);
    return snapshot;
  } catch (error) {
    console.error('Failed to save authority snapshot:', error);
    throw new Error('Failed to save authority snapshot');
  }
}

export async function getAuthorityHistory(domain: string, days: number = 30) {
  try {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const snapshots = await prisma.authoritySnapshot.findMany({
      where: {
        domain,
        fetchedAt: {
          gte: since,
        },
      },
      orderBy: {
        fetchedAt: 'asc',
      },
    });

    return snapshots;
  } catch (error) {
    console.error('Failed to fetch authority history:', error);
    throw new Error('Failed to fetch authority history');
  }
}
