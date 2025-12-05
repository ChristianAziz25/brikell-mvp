/**
 * Central export for all AI tools
 * Import tools here and export them for use in streamText
 */

import prisma from '@/lib/prisma/client';
import { getAllAssets } from '@/lib/prisma/models/asset';
import { getAllRentRollUnits } from '@/lib/prisma/models/rentRollUnit';
import { tool } from 'ai';
import { z } from 'zod';
import { ragTools } from './ragTools';

// Database Tools
export const getAssetsTool = tool({
  description: 'Retrieve all assets from the database',
  inputSchema: z.object({
    limit: z.number().optional().describe('Maximum number of assets to return'),
  }),
  execute: async ({ limit }) => {
    const assets = await getAllAssets();
    return limit ? assets.slice(0, limit) : assets;
  },
});

export const getRentRollTool = tool({
  description: 'Retrieve rent roll units from the database',
  inputSchema: z.object({
    propertyName: z.string().optional().describe('Filter by property name'),
    status: z.enum(['occupied', 'vacant', 'terminated']).optional().describe('Filter by unit status'),
    limit: z.number().optional().describe('Maximum number of units to return'),
  }),
  execute: async ({ propertyName, status, limit }) => {
    let units = await getAllRentRollUnits();
    
    if (propertyName) {
      units = units.filter(u => u.property_name === propertyName);
    }
    
    if (status) {
      units = units.filter(u => u.units_status === status);
    }
    
    return limit ? units.slice(0, limit) : units;
  },
});

export const queryDatabaseTool = tool({
  description: 'Execute a Prisma query to fetch data from the database',
  inputSchema: z.object({
    model: z.enum(['Asset', 'RentRollUnit', 'Capex', 'Opex']).describe('The Prisma model to query'),
    filters: z.record(z.string(), z.unknown()).optional().describe('Optional filters to apply'),
    limit: z.number().optional().describe('Maximum number of records to return'),
  }),
  execute: async ({ model, filters, limit }) => {
    const take = limit || 100;
    
    switch (model) {
      case 'Asset':
        return await prisma.asset.findMany({ where: filters, take });
      case 'RentRollUnit':
        return await prisma.rentRollUnit.findMany({ where: filters, take });
      case 'Capex':
        return await prisma.capex.findMany({ where: filters, take, orderBy: { capex_year: 'asc' } });
      case 'Opex':
        return await prisma.opex.findMany({ where: filters, take, orderBy: { opex_year: 'asc' } });
      default:
        throw new Error(`Unknown model: ${model}`);
    }
  },
});

// Analysis Tools
export const calculateNOITool = tool({
  description: 'Calculate Net Operating Income (NOI) for a property',
  inputSchema: z.object({
    propertyName: z.string().describe('Name of the property'),
    year: z.number().optional().describe('Year to calculate NOI for'),
  }),
  execute: async ({ propertyName, year }) => {
    // Implementation for NOI calculation
    // This is a placeholder - implement based on your business logic
    return {
      propertyName,
      year: year || new Date().getFullYear(),
      noi: 0, // Calculate actual NOI
      message: 'NOI calculation not yet implemented',
    };
  },
});

// Export all tools as a single object for use in streamText
export const tools = {
  getAssets: getAssetsTool,
  getRentRoll: getRentRollTool,
  queryDatabase: queryDatabaseTool,
  calculateNOI: calculateNOITool,
  // RAG tools
  ...ragTools,
};

// Export RAG tools separately for convenience
export { ragTools } from './ragTools';

