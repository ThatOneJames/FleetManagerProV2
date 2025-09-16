using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;

namespace FleetManagerPro.API.Data.Repository
{
    public class Repository<T> : IRepository<T> where T : class
    {
        protected readonly FleetManagerDbContext _context;
        private readonly DbSet<T> _dbSet;

        public Repository(FleetManagerDbContext context)
        {
            _context = context;
            _dbSet = _context.Set<T>();
        }

        public async new Task<IEnumerable<T>> GetAllAsync() => await _dbSet.ToListAsync();

        public async new Task<T?> GetByIdAsync(int id) => await _dbSet.FindAsync(id);

        public async new Task<IEnumerable<T>> FindAsync(Expression<Func<T, bool>> predicate) =>
            await _dbSet.Where(predicate).ToListAsync();

        public async new Task AddAsync(T entity) => await _dbSet.AddAsync(entity);

        public void Update(T entity) => _dbSet.Update(entity);

        public void Remove(T entity) => _dbSet.Remove(entity);
    }
}
