import {
  findUniqueSharedLink
} from '../../src/services/db.service'; 

class MockPrismaClient {
    PrismaService = {
        sharedLink: {
            findUnique: jest.fn(() => { })
        }
    }
}


describe('Database Service Functions', () => {
    const mockPrisma = new MockPrismaClient();

    it('should return undefined if the shared link does not exist', async () => {
        (mockPrisma.PrismaService.sharedLink.findUnique as jest.Mock).mockReturnValue(null);
      
        const result = await findUniqueSharedLink(999);

      expect(result).toBeUndefined();
    });
});
